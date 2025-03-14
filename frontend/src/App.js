import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Box,
} from "@mui/material";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeURL, setResumeURL] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description!");
      return;
    }
    if (!resumeFile) {
      setError("Please upload a resume!");
      return;
    }

    setError("");
    await analyzeResume();
  };

  const analyzeResume = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      formData.append("resume", resumeFile);

      console.log("Sending request with data:", { 
        jobDescription: jobDescription.substring(0, 100) + "...", 
        resumeFileName: resumeFile.name 
      });

      const response = await axios.post("http://localhost:8000/analyze-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Backend Response:", response.data);

      if (response.data.ats_score !== undefined) {
        setAtsScore(response.data.ats_score);
        setMatchedKeywords(response.data.matched_keywords || []);
        setMissingKeywords(response.data.missing_keywords || []);
      } else {
        setError("Failed to calculate ATS score. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError("Failed to analyze resume: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
      const url = URL.createObjectURL(file);
      setResumeURL(url);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
      setResumeFile(null);
      setResumeURL(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 5, backgroundColor: "#f5f5f5" }}>
        <Typography variant="h3" sx={{ mb: 4, textAlign: "center", fontWeight: "bold", color: "#333" }}>
          Resume ATS Score Analyzer
        </Typography>

        {error && (
          <Box sx={{ mb: 3 }}>
            <Card sx={{ backgroundColor: "#ffebee", p: 2 }}>
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Card>
          </Box>
        )}

        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Card sx={{ width: "100%", boxShadow: 3, display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ p: 4, flexGrow: 1 }}>
                <Typography variant="h5" sx={{ textAlign: "center", color: "#1976d2", fontWeight: "bold", mb: 3 }}>
                  Job Description Analysis 📝
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  variant="outlined"
                  label="Paste Job Description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  sx={{ py: 1.5, fontSize: "1.1rem" }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : "Analyze Resume"}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Card sx={{ width: "100%", boxShadow: 3, display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ p: 4, flexGrow: 1 }}>
                <Typography variant="h5" sx={{ textAlign: "center", color: "#2e7d32", fontWeight: "bold", mb: 3 }}>
                  Upload Your Resume 📂
                </Typography>

                <Box sx={{ border: "2px dashed #ccc", borderRadius: 2, p: 3, textAlign: "center", mb: 3 }}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    style={{ display: "none" }}
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button variant="contained" component="span" color="secondary">
                      Select PDF Resume
                    </Button>
                  </label>
                  {resumeFile && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected: {resumeFile.name}
                    </Typography>
                  )}
                </Box>

                {resumeURL && (
                  <Box sx={{ mt: 3, border: "1px solid #e0e0e0", p: 1, height: "300px", overflow: "auto" }}>
                    <Typography variant="subtitle1" sx={{ textAlign: "center", mb: 1 }}>
                      Resume Preview 📄
                    </Typography>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                      <Viewer fileUrl={resumeURL} />
                    </Worker>
                  </Box>
                )}

                {atsScore !== null && !isLoading && (
                  <Card sx={{ mt: 3, p: 3, boxShadow: 2, backgroundColor: "#fff" }}>
                    <Typography variant="h5" sx={{ textAlign: "center", color: atsScore > 70 ? "#2e7d32" : atsScore > 50 ? "#ed6c02" : "#d32f2f", fontWeight: "bold" }}>
                      ATS Score: {atsScore}%
                    </Typography>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                        ✅ Matched Keywords ({matchedKeywords.length})
                      </Typography>
                      <Box sx={{ p: 1, backgroundColor: "#e3f2fd", borderRadius: 1, minHeight: "40px" }}>
                        {matchedKeywords.length > 0 ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {matchedKeywords.map((keyword, index) => (
                              <Chip key={index} label={keyword} color="primary" variant="outlined" />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">None found</Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ color: "#d32f2f", mb: 1 }}>
                        ❌ Missing Keywords ({missingKeywords.length})
                      </Typography>
                      <Box sx={{ p: 1, backgroundColor: "#ffebee", borderRadius: 1, minHeight: "40px" }}>
                        {missingKeywords.length > 0 ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {missingKeywords.map((keyword, index) => (
                              <Chip key={index} label={keyword} color="error" variant="outlined" />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">None! Great job!</Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </div>
  );
}

const Chip = ({ label, color, variant }) => (
  <span style={{ 
    display: "inline-block", 
    padding: "4px 10px", 
    borderRadius: "16px", 
    border: `1px solid ${color === "primary" ? "#1976d2" : "#d32f2f"}`,
    backgroundColor: color === "primary" ? "rgba(25, 118, 210, 0.1)" : "rgba(211, 47, 47, 0.1)",
    color: color === "primary" ? "#1976d2" : "#d32f2f",
    margin: "2px",
    fontSize: "0.85rem"
  }}>
    {label}
  </span>
);

export default App;