"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Link,
  Container,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Log } from "../../logging-middleware/log"; // Adjust based on your structure

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" }, // Blue
    secondary: { main: "#455a64" }, // Blue-grey
    background: { default: "#f5f7fa" },
  },
});

const MAX_URLS = 5;

export default function UrlShortenerPage() {
  const [urls, setUrls] = useState([
    { original: "", shortcode: "", validity: "", shortUrl: "", expiresAt: "", error: "" },
  ]);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    Log("frontend", "info", "ui", "URL Shortener page loaded");
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...urls];
    updated[index][field] = value;
    setUrls(updated);
  };

  const handleAdd = () => {
    if (urls.length >= MAX_URLS) {
      setMessage("Maximum 5 URLs allowed.");
      setSnackbarOpen(true);
      Log("frontend", "warn", "form", "User tried to exceed 5 URL limit");
      return;
    }
    setUrls([...urls, { original: "", shortcode: "", validity: "", shortUrl: "", expiresAt: "", error: "" }]);
    Log("frontend", "info", "form", "Added new URL input field");
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    const updated = [...urls];
    let hasError = false;

    for (let i = 0; i < updated.length; i++) {
      const { original, shortcode, validity } = updated[i];

      if (!isValidUrl(original)) {
        updated[i].error = "Invalid URL.";
        Log("frontend", "error", "validation", `Invalid URL at index ${i}: ${original}`);
        hasError = true;
        continue;
      }

      if (validity && (!/^\d+$/.test(validity) || Number(validity) <= 0)) {
        updated[i].error = "Validity must be a positive number.";
        Log("frontend", "error", "validation", `Invalid validity at index ${i}: ${validity}`);
        hasError = true;
        continue;
      }

      try {
        const res = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            longUrl: original,
            shortcode: shortcode || undefined,
            validity: validity ? Number(validity) : 30,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to shorten.");

        updated[i].shortUrl = `http://localhost:3000/${data.shortcode}`;
        updated[i].expiresAt = new Date(data.expiresAt).toLocaleString();
        updated[i].error = "";

        Log("frontend", "info", "api", `Shortened URL created: ${data.shortcode}`);
      } catch (err) {
        updated[i].error = err.message;
        Log("frontend", "error", "api", `Failed to shorten URL at index ${i}: ${err.message}`);
        hasError = true;
      }
    }

    setUrls(updated);
    setMessage(hasError ? "Some URLs failed." : "All URLs shortened!");
    setSnackbarOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 5 }}>
        <Container maxWidth="md">
          <Typography variant="h3" color="primary" gutterBottom align="center" fontWeight={600}>
            🔗 URL Shortener
          </Typography>
          <Typography variant="subtitle1" align="center" color="secondary">
            Shorten your links with optional custom codes & expiry.
          </Typography>

          <Divider sx={{ my: 4 }} />

          {urls.map((item, index) => (
            <Card key={index} sx={{ mb: 3, p: 2, background: "#fff", boxShadow: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      URL #{index + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Original URL"
                      fullWidth
                      value={item.original}
                      onChange={(e) => handleChange(index, "original", e.target.value)}
                      error={!!item.error}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Shortcode (optional)"
                      fullWidth
                      value={item.shortcode}
                      onChange={(e) => handleChange(index, "shortcode", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Validity (min)"
                      fullWidth
                      value={item.validity}
                      onChange={(e) => handleChange(index, "validity", e.target.value)}
                    />
                  </Grid>
                  {item.shortUrl && (
                    <Grid item xs={12}>
                      <Typography>
                        ✅ Short URL:{" "}
                        <Link href={item.shortUrl} target="_blank" underline="hover">
                          {item.shortUrl}
                        </Link>
                      </Typography>
                      <Typography color="text.secondary">Expires: {item.expiresAt}</Typography>
                    </Grid>
                  )}
                  {item.error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{item.error}</Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Box display="flex" justifyContent="center" gap={2} mt={4}>
            <Button variant="outlined" onClick={handleAdd} color="secondary">
              ➕ Add URL
            </Button>
            <Button variant="contained" onClick={handleSubmit} color="primary">
              🚀 Shorten URLs
            </Button>
          </Box>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
          >
            <Alert severity="info" onClose={() => setSnackbarOpen(false)}>
              {message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
