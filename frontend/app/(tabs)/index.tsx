// frontend/app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { getNotes, createNote } from '../services/api';

// Define types
type Note = {
  _id: string;
  title: string;
  body: string;
};

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    getNotes().then(setNotes);
  }, []);

  const handleAdd = async () => {
    const newNote: Note = await createNote({ title: 'Hello', body: 'World' });
    setNotes(prev => [...prev, newNote]);
  };

  return (
    <View>
      {notes.map(note => (
        <Text key={note._id}>{note.title}</Text>
      ))}
      <Button title="Add Note" onPress={handleAdd} />
    </View>
  );
}