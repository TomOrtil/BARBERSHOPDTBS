// frontend/services/api.ts

const BASE_URL = 'http://192.168.1.10:5000'; // replace with your actual IP from ipconfig

export const getNotes = async (): Promise<any[]> => {
  const res = await fetch(`${BASE_URL}/notes`);
  return res.json();
};

export const createNote = async (note: { title: string; body: string }): Promise<any> => {
  const res = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return res.json();
};

export const deleteNote = async (id: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};