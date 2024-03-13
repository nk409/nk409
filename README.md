Hi there 👋

I’m currently working on ...Cyber Security Q&A. Keep checking
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Windows.Forms;
using System.Threading.Tasks;

class Program
{
    [STAThread]
    static async Task Main(string[] args)
    {
        string filePath = "your_executable_path.exe";

        try
        {
            List<string> strings = await ReadStringsFromExecutableAsync(filePath);
            ShowStringsInListBox(strings);
        }
        catch (Exception ex)
        {
            MessageBox.Show("An error occurred: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    static async Task<List<string>> ReadStringsFromExecutableAsync(string filePath)
    {
        List<string> stringList = new List<string>();

        await using FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        using BinaryReader br = new BinaryReader(fs);
        MemoryStream ms = new MemoryStream();

        long length = fs.Length;
        long position = 0;
        while (position < length)
        {
            byte currentByte = br.ReadByte();
            if (currentByte == 0) // Null terminator indicates end of string
            {
                ms.Position = 0;
                string str = Encoding.ASCII.GetString(ms.ToArray());
                ms.SetLength(0); // Reset the stream for the next string
                if (!string.IsNullOrEmpty(str))
                {
                    stringList.Add(str);
                }
            }
            else if (currentByte >= 0x20 && currentByte <= 0x7E) // Printable ASCII character
            {
                ms.WriteByte(currentByte);
            }
            else
            {
                // Non-printable characters or non-string data, skip
            }
            position++;
        }

        return stringList;
    }

    static void ShowStringsInListBox(List<string> strings)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        Form form = new Form();
        ListBox listBox = new ListBox();
        listBox.Dock = DockStyle.Fill;

        foreach (string str in strings)
        {
            listBox.Items.Add(str);
        }

        form.Controls.Add(listBox);
        Application.Run(form);
    }
}
