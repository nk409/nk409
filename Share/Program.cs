using FIleUploadUtility;
using Grpc.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();
var key = Encoding.UTF8.GetBytes("testfor");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddGrpc();
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<SessionManager>();
//builder.Services.AddSingleton<IFileService, FileService>();

var app = builder.Build();
app.UseCors(opt=>opt.WithOrigins("http://localhost:5173/").AllowCredentials().AllowAnyMethod().AllowAnyHeader());
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapGrpcService<FileProcessingService>();
app.MapGrpcService<ProgressService>();
app.UseAuthorization();

app.MapControllers();

app.Run();
//Task.Run(async () =>
//{
//    while (true)
//    {
//        _sessionManager.CleanupInactiveSessions();
//        await Task.Delay(60000); 
//    }
//});
