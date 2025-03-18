using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using System.IO.Compression;
namespace FIleUploadUtility
{
    public class FileProcessingService : FileProcessing.FileProcessingBase
    {
        private readonly SessionManager _sessionManager;

        public FileProcessingService(SessionManager sessionManager)
        {
            _sessionManager = sessionManager;
        }

        public override async Task<ProcessingResponse> UploadFile(IAsyncStreamReader<FileChunk> requestStream, ServerCallContext context)
        {
            var sessionId = Guid.NewGuid().ToString();
            var ip = context.Peer;
            _sessionManager.CreateSession(sessionId, ip);

            var tempFolder = Path.Combine("Uploads", sessionId);
            Directory.CreateDirectory(tempFolder);

            await foreach (var chunk in requestStream.ReadAllAsync())
            {
                var filePath = Path.Combine(tempFolder, chunk.FileName);
                await File.WriteAllBytesAsync(filePath, chunk.Data.ToByteArray());
            }

            _ = Task.Run(async () =>
            {
                await Task.Delay(10000); // Simulate processing
                var zipFilePath = Path.Combine("Uploads", $"{sessionId}.zip");
                using var archive = ZipFile.Open(zipFilePath, ZipArchiveMode.Create);
                foreach (var file in Directory.GetFiles(tempFolder))
                {
                    archive.CreateEntryFromFile(file, Path.GetFileName(file));
                }
                _sessionManager.UpdateSession(sessionId, "Completed", zipFilePath);
            });

            return new ProcessingResponse { SessionId = sessionId, Message = "Processing Started" };
        }
        public override async Task<RecentSessionsResponse> GetRecentSessions(Empty request, ServerCallContext context)
        {
            var sessions = _sessionManager.GetRecentSessions();
            var response = new RecentSessionsResponse();

            foreach (var session in sessions)
            {
                response.Sessions.Add(new RecentSession
                {
                    SessionId = session.SessionId,
                    Status = session.Status,
                    Ip = session.IP
                });
            }

            return response;
        }
        public override Task<StatusResponse> GetStatus(StatusRequest request, ServerCallContext context)
        {
            var session = _sessionManager.GetSession(request.SessionId);
            return Task.FromResult(new StatusResponse { Status = session.Status, ZipFileName = session.ZipFilePath });
        }

        public override async Task DownloadFile(DownloadRequest request, IServerStreamWriter<FileChunk> responseStream, ServerCallContext context)
        {
            var session = _sessionManager.GetSession(request.SessionId);
            if (session.Status != "Completed" || string.IsNullOrEmpty(session.ZipFilePath))
            {
                throw new RpcException(new Status(StatusCode.NotFound, "File not ready"));
            }

            var buffer = new byte[1024 * 1024]; // 1MB chunk size
            await using var stream = new FileStream(session.ZipFilePath, FileMode.Open, FileAccess.Read);
            int bytesRead;
            while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                await responseStream.WriteAsync(new FileChunk { Data = Google.Protobuf.ByteString.CopyFrom(buffer, 0, bytesRead) });
            }
        }
    }
    public class SessionManager
    {
        private readonly Dictionary<string, (string Status, string ZipFilePath, string IP, DateTime LastActive)> _sessions = new();
        private readonly object _lock = new();
        public void CreateSession(string sessionId, string ip)
        {
            lock (_lock)
            {
                _sessions[sessionId] = ("Processing", null, ip, DateTime.UtcNow);
            }
        }

        public void UpdateSession(string sessionId, string status, string zipFilePath)
        {
            lock (_lock)
            {
                if (_sessions.ContainsKey(sessionId))
                    _sessions[sessionId] = (status, zipFilePath, _sessions[sessionId].IP, DateTime.UtcNow);
            }
        }

        public (string Status, string ZipFilePath, string IP, DateTime LastActive) GetSession(string sessionId)
        {
            lock (_lock)
            {
                return _sessions.TryGetValue(sessionId, out var sessionData)
            ? sessionData
            : ("Not Found", null, null, DateTime.MinValue);
            }
        }

        public List<(string SessionId, string Status, string IP)> GetRecentSessions()
        {
            lock (_lock)
            {
                return _sessions.OrderByDescending(s => s.Value.LastActive)
                                .Take(5)
                                .Select(s => (s.Key, s.Value.Status, s.Value.IP))
                                .ToList();
            }
        }

        public void RemoveSession(string sessionId)
        {
            lock (_lock)
            {
                _sessions.Remove(sessionId);
            }
        }
        public void UpdateSessionActivity(string sessionId)
        {
            lock (_lock)
            {
                if (_sessions.ContainsKey(sessionId))
                    _sessions[sessionId] = (_sessions[sessionId].Status, _sessions[sessionId].ZipFilePath, _sessions[sessionId].IP, DateTime.UtcNow);
            }
        }

        public void CleanupInactiveSessions()
        {
            lock (_lock)
            {
                var inactiveSessions = _sessions.Where(s => (DateTime.UtcNow - s.Value.LastActive).TotalMinutes > 10).Select(s => s.Key).ToList();
                foreach (var session in inactiveSessions)
                {
                    _sessions.Remove(session);
                }
            }
        }

    }
    public class ProgressService : FileProcessing.FileProcessingBase
    {
        private readonly IFileService _fileService;

        public ProgressService(IFileService fileService)
        {
            _fileService = fileService;
        }

        public override async Task<StatusResponse> GetStatus(StatusRequest request, ServerCallContext context)
        {
            var status = await _fileService.GetProcessingStatus(request.SessionId);
            return new StatusResponse
            {
                Status = status?.Status ?? "Not Found",
                ZipFileName = status?.Status == "Completed" ? $"/download/{request.SessionId}" : "",
                Progress = status?.Progress.ToString() ?? "0"                
            };
        }

        public override async Task DownloadFile(DownloadRequest request, IServerStreamWriter<FileChunk> responseStream, ServerCallContext context)
        {
            var fileStream = await _fileService.GetProcessedFile(request.SessionId);
            if (fileStream == null)
                throw new RpcException(new Status(StatusCode.NotFound, "File not ready"));

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = await fileStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                await responseStream.WriteAsync(new FileChunk { Data = Google.Protobuf.ByteString.CopyFrom(buffer, 0, bytesRead) });
            }
        }
    }
}

