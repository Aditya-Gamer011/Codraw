"use client";

const html = `
<!DOCTYPE html>
<html>
<head>
<style>
body{
    margin:0;
    padding:40px;
    font-family:Arial, sans-serif;
    background:#111827;
    color:white;
}

button{
    padding:12px 24px;
    background:#2563eb;
    color:white;
    border:none;
    border-radius:8px;
    cursor:pointer;
}
</style>
</head>

<body>

<h1>Hello from CodeDraw 🚀</h1>

<p>This webpage is being rendered inside an iframe.</p>

<button>Click Me</button>

</body>
</html>
`;

export default function Preview() {
    return (
        <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="Preview"
        />
    );
}