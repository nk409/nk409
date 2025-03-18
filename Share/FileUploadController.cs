using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace FIleUploadUtility
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileUploadController : ControllerBase
    {
        private readonly ILogger<FileUploadController> _logger;
        private readonly IFileService _fileService;

        public FileUploadController(ILogger<FileUploadController> logger, IFileService fileService)
        {
            _logger = logger;
            _fileService = fileService;
        }
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFiles([FromForm] FileUploadRequest request)
        {
            if (request.PdfFile == null || request.ExcelFile == null)
                return BadRequest(new ApiResponse<string> { Success = false, Message = ErrorMessages.FileNotProvided });

            string sessionId = await _fileService.ProcessFilesAsync(request.PdfFile, request.ExcelFile);
            return Ok(new ApiResponse<string> { Success = true, Message = "Files uploaded successfully.", Data = sessionId });
        }

        [HttpGet("status/{sessionId}")]
        public async Task<IActionResult> GetStatus(string sessionId)
        {
            var status = await _fileService.GetProcessingStatus(sessionId);
            if (status == null)
                return NotFound(new ApiResponse<string> { Success = false, Message = "Session not found." });

            return Ok(new ApiResponse<ProcessingStatus> { Success = true, Message = "Status retrieved.", Data = status });
        }

        [HttpGet("recent-sessions")]
        public async Task<IActionResult> GetRecentSessions()
        {
            var sessions = await _fileService.GetRecentSessions();
            return Ok(new ApiResponse<List<SessionInfo>> { Success = true, Message = "Recent sessions retrieved.", Data = sessions });
        }

        [HttpPost("heartbeat")]
        public async Task<IActionResult> SendHeartbeat([FromBody] HeartbeatRequest request)
        {
            bool updated = await _fileService.UpdateSessionHeartbeat(request.SessionId);
            if (!updated)
                return NotFound(new ApiResponse<string> { Success = false, Message = "Session not found." });

            return Ok(new ApiResponse<string> { Success = true, Message = "Heartbeat received." });
        }

        [HttpGet("download/{sessionId}")]
        public async Task<IActionResult> DownloadFile(string sessionId)
        {
            var fileStream = await _fileService.GetProcessedFile(sessionId);
            if (fileStream == null)
                return NotFound(new ApiResponse<string> { Success = false, Message = "File not found or not ready." });

            return File(fileStream, "application/zip", "processed_files.zip");
        }
    }
    public static class ErrorMessages
    {
        public const string FileNotProvided = "File is required.";
        public const string InvalidFileFormat = "Invalid file format.";
        public const string ProcessingFailed = "File processing failed.";
        public const string SessionNotFound = "Session not found.";
        public const string FileNotReady = "File not found or not ready.";
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
    }
    public class FileUploadRequest
    {
        public IFormFile PdfFile { get; set; }
        public IFormFile ExcelFile { get; set; }
    }
    public class HeartbeatRequest
    {
        public string SessionId { get; set; }
    }
    public interface IFileService
    {
        Task<string> ProcessFilesAsync(IFormFile pdfFile, IFormFile excelFile);
        Task<ProcessingStatus> GetProcessingStatus(string sessionId);
        Task<List<SessionInfo>> GetRecentSessions();
        Task<bool> UpdateSessionHeartbeat(string sessionId);
        Task<Stream> GetProcessedFile(string sessionId);
    }
    public class FileService : IFileService
    {
        private static readonly ConcurrentDictionary<string, ProcessingStatus> _processingStatuses = new();
        private static readonly ConcurrentDictionary<string, DateTime> _sessionHeartbeats = new();
        private static readonly List<SessionInfo> _recentSessions = new();
        private static readonly object _lock = new();

        public async Task<string> ProcessFilesAsync(IFormFile pdfFile, IFormFile excelFile)
        {
            string sessionId = Guid.NewGuid().ToString();
            _processingStatuses[sessionId] = new ProcessingStatus { Status = "Processing", Progress = 0 };

            lock (_lock)
            {
                _recentSessions.Insert(0, new SessionInfo { SessionId = sessionId, Status = "Processing", Ip = "User_IP" });
                if (_recentSessions.Count > 5) _recentSessions.RemoveAt(5);
            }

            // Simulate asynchronous file processing
            _ = Task.Run(async () =>
            {
                for (int i = 1; i <= 100; i += 10)
                {
                    _processingStatuses[sessionId].Progress = i;
                    await Task.Delay(500);
                }
                _processingStatuses[sessionId].Status = "Completed";
            });

            return sessionId;
        }

        public async Task<ProcessingStatus> GetProcessingStatus(string sessionId)
        {
            _processingStatuses.TryGetValue(sessionId, out var status);
            return await Task.FromResult(status);
        }

        public async Task<List<SessionInfo>> GetRecentSessions()
        {
            return await Task.FromResult(_recentSessions);
        }

        public async Task<bool> UpdateSessionHeartbeat(string sessionId)
        {
            if (!_processingStatuses.ContainsKey(sessionId)) return false;

            _sessionHeartbeats[sessionId] = DateTime.UtcNow;
            return await Task.FromResult(true);
        }

        public async Task<Stream> GetProcessedFile(string sessionId)
        {
            if (!_processingStatuses.ContainsKey(sessionId) || _processingStatuses[sessionId].Status != "Completed")
                return null;

            // Simulating file generation
            var memoryStream = new MemoryStream();
            var writer = new StreamWriter(memoryStream);
            await writer.WriteAsync("Sample ZIP file content");
            await writer.FlushAsync();
            memoryStream.Position = 0;

            return memoryStream;
        }
    }

    public class ProcessingStatus
    {
        public string Status { get; set; }
        public int Progress { get; set; }
    }

    public class SessionInfo
    {
        public string SessionId { get; set; }
        public string Status { get; set; }
        public string Ip { get; set; }
    }
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        public ExceptionHandlingMiddleware(RequestDelegate next) => _next = next;

        public async Task Invoke(HttpContext context)
        {
            try { await _next(context); }
            catch (Exception ex)
            {
                context.Response.StatusCode = 500;
                await context.Response.WriteAsJsonAsync(new ApiResponse<string>
                {
                    Success = false,
                    Message = "An unexpected error occurred."
                });
            }
        }
    }

}
