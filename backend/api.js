// frontend/services/api.js

// Use your computer's local IP address (not localhost!)
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
const BASE_URL = 'http://192.168.1.10:5000';

export const getNotes = async () => {
  const res = await fetch(`${BASE_URL}/notes`);
  return res.json();
};

export const createNote = async (note) => {
  const res = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return res.json();
};