/**
 * Advanced Pattern 2: File Upload
 * 
 * Concepts covered:
 * - Multipart form data handling
 * - File upload processing
 * - File type validation
 * - File size limits
 * - Storing uploaded files
 * - Serving static files
 * 
 * Run: bun run 05-advanced-patterns/02-file-upload.ts
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

const UPLOAD_DIR = "./uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"];

let uploadedFiles: UploadedFile[] = [];

// Ensure upload directory exists
await mkdir(UPLOAD_DIR, { recursive: true });

function generateId(): string {
  return crypto.randomUUID();
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // POST /upload - Upload a file
      if (path === "/upload" && method === "POST") {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
          return Response.json(
            { error: "No file provided" },
            { status: 400 }
          );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return Response.json(
            { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
            { status: 400 }
          );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          return Response.json(
            { error: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(", ")}` },
            { status: 400 }
          );
        }

        // Generate unique filename
        const id = generateId();
        const extension = getFileExtension(file.name);
        const filename = `${id}${extension}`;
        const filepath = join(UPLOAD_DIR, filename);

        // Save file
        const buffer = await file.arrayBuffer();
        await writeFile(filepath, new Uint8Array(buffer));

        const uploadedFile: UploadedFile = {
          id,
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        uploadedFiles.push(uploadedFile);

        return Response.json({
          message: "File uploaded successfully",
          file: uploadedFile,
          url: `http://localhost:${server.port}/files/${filename}`,
        }, { status: 201 });
      }

      // GET /files - List all uploaded files
      if (path === "/files" && method === "GET") {
        const files = uploadedFiles.map(f => ({
          ...f,
          url: `http://localhost:${server.port}/files/${f.filename}`,
        }));

        return Response.json({
          total: files.length,
          files,
        });
      }

      // GET /files/:filename - Serve a file
      const fileMatch = path.match(/^\/files\/(.+)$/);
      if (fileMatch && method === "GET") {
        const filename = fileMatch[1];
        const file = uploadedFiles.find(f => f.filename === filename);

        if (!file) {
          return Response.json(
            { error: "File not found" },
            { status: 404 }
          );
        }

        const filepath = join(UPLOAD_DIR, filename);
        
        try {
          const bunFile = Bun.file(filepath);
          return new Response(bunFile, {
            headers: {
              "Content-Type": file.mimeType,
              "Content-Disposition": `inline; filename="${file.originalName}"`,
            },
          });
        } catch {
          return Response.json(
            { error: "File not found on disk" },
            { status: 404 }
          );
        }
      }

      // DELETE /files/:id - Delete a file
      const deleteMatch = path.match(/^\/files\/(.+)$/);
      if (deleteMatch && method === "DELETE") {
        const id = deleteMatch[1]!.replace(/\.[^.]+$/, ""); // Remove extension
        const index = uploadedFiles.findIndex(f => f.id === id);

        if (index === -1) {
          return Response.json(
            { error: "File not found" },
            { status: 404 }
          );
        }

        const file = uploadedFiles[index]!;
        const filepath = join(UPLOAD_DIR, file.filename);

        // Delete file from disk
        try {
          await writeFile(filepath, ""); // Overwrite with empty content
        } catch {
          // File might already be deleted
        }

        uploadedFiles.splice(index, 1);

        return Response.json({
          message: "File deleted successfully",
        });
      }

      // GET /upload-form - Simple HTML upload form for testing
      if (path === "/upload-form" && method === "GET") {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>File Upload</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        form { border: 2px dashed #ccc; padding: 30px; border-radius: 8px; }
        input[type="file"] { margin: 20px 0; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        #result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>File Upload Example</h1>
    <form id="uploadForm">
        <input type="file" name="file" accept="image/*,.pdf" required>
        <br>
        <button type="submit">Upload File</button>
    </form>
    <div id="result"></div>

    <script>
        document.getElementById('uploadForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const result = document.getElementById('result');
            
            try {
                result.textContent = 'Uploading...';
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    result.innerHTML = \`
                        <h3>Upload Successful!</h3>
                        <p><strong>File:</strong> \${data.file.originalName}</p>
                        <p><strong>Size:</strong> \${(data.file.size / 1024).toFixed(2)} KB</p>
                        <p><strong>URL:</strong> <a href="\${data.url}" target="_blank">\${data.url}</a></p>
                    \`;
                } else {
                    result.textContent = 'Error: ' + data.error;
                }
            } catch (error) {
                result.textContent = 'Upload failed: ' + error.message;
            }
        };
    </script>
</body>
</html>
        `;

        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      return Response.json({ error: "Not found" }, { status: 404 });

    } catch (error) {
      console.error("Error:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
});

console.log(`📎 File Upload API running at http://localhost:${server.port}`);
console.log(`\nEndpoints:`);
console.log(`  POST   /upload`);
console.log(`  GET    /files`);
console.log(`  GET    /files/:filename`);
console.log(`  DELETE /files/:id`);
console.log(`  GET    /upload-form (browser UI)`);
console.log(`\nSettings:`);
console.log(`  Max file size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
console.log(`  Allowed types: ${ALLOWED_TYPES.join(", ")}`);
console.log(`  Upload directory: ${UPLOAD_DIR}`);
console.log(`\nTest in browser: http://localhost:${server.port}/upload-form`);
console.log(`\nOr with curl:`);
console.log(`curl -X POST http://localhost:3000/upload -F "file=@/path/to/your/file.jpg"`);
