import React, { useState, useEffect } from "react";
import apiClient from "./apiClient";
import { Container, Row, Col, ListGroup, Button, ProgressBar } from "react-bootstrap";

const FileUpload: React.FC = () => {
    const [pdf, setPdf] = useState<File | null>(null);
    const [excel, setExcel] = useState<File | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("");
    const [recentSessions, setRecentSessions] = useState<{ sessionId: string; status: string; ip: string }[]>([]);
    const [downloadUrl, setDownloadUrl] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        fetchRecentSessions();
    }, []);

    useEffect(() => {
        if (sessionId) {
            const interval = setInterval(async () => {
                try {
                    const response = await apiClient.get(`/status/${sessionId}`);
                    setProgress(parseInt(response.data.progress, 10));
                    setStatus(response.data.status);

                    if (response.data.status === "Completed") {
                        setDownloadUrl(response.data.zipFileName);
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error("Error fetching progress:", error);
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [sessionId]);

    const handleUpload = async () => {
        if (!pdf || !excel) return alert("Please select both files");

        const formData = new FormData();
        formData.append("pdfFile", pdf);
        formData.append("excelFile", excel);

        try {
            const response = await apiClient.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSessionId(response.data.sessionId);
            setStatus("Processing...");
            fetchRecentSessions();
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    const fetchRecentSessions = async () => {
        try {
            const response = await apiClient.get("/recent-sessions");
            setRecentSessions(response.data.sessions);
        } catch (error) {
            console.error("Error fetching recent sessions:", error);
        }
    };

    const handleDownload = async () => {
        if (!sessionId) return;
        try {
            const response = await apiClient.get(`/download/${sessionId}`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "ProcessedFiles.zip");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    return (
        <Container fluid>
            <Row>
                <Col md={6}>
                    <h4>Upload Files</h4>
                    <input type="file" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
                    <input type="file" onChange={(e) => setExcel(e.target.files?.[0] || null)} />
                    <Button onClick={handleUpload} className="mt-2">Upload</Button>
                    {status && <p>Status: {status}</p>}
                    <ProgressBar now={progress} label={`${progress}%`} className="mt-2" />
                    {downloadUrl && (
                        <Button onClick={handleDownload} className="mt-2">Download</Button>
                    )}
                </Col>
                <Col md={6}>
                    <h4>Recent Sessions</h4>
                    <ListGroup>
                        {recentSessions.map((session) => (
                            <ListGroup.Item key={session.sessionId}>
                                <strong>Session:</strong> {session.sessionId} <br />
                                <strong>Status:</strong> {session.status} <br />
                                <strong>IP:</strong> {session.ip}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Col>
            </Row>
        </Container>
    );
};

export default FileUpload;
