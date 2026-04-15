import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { loginEmployee } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!contactNo || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await loginEmployee(contactNo, password);
      if (res.message === 'Login successful') {
        router.push('/dashboard');
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('@/assets/images/bbshop.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Premier Barber Shop</Text>
        <Text style={styles.subtitle}>Admin access portal</Text>

        <TextInput
          style={styles.input}
          placeholder="Username or Contact Number"
          placeholderTextColor="#8d8a83"
          value={contactNo}
          onChangeText={setContactNo}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8d8a83"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efede9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    backgroundColor: '#f8f6f1',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: '#d8c7a0',
    shadowColor: '#8b6f2b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5f4615',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8b7b5d',
    marginTop: 8,
    marginBottom: 28,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#35260f',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#bdb2a2',
  },
  button: {
    backgroundColor: '#1b56b3',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
