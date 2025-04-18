import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert, Switch, Platform } from 'react-native';
import Voice from '@react-native-voice/voice'; // Import react-native-voice
import axios from 'axios';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [theme, setTheme] = useState('light');
  const [accuracy, setAccuracy] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecording = async () => {
    setTranscript('');
    setAccuracy(0);
    setWordCount(0);
    setTimer(0);
    setStartTime(Date.now());
    setIsRecording(true);
    await Voice.start(language);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await Voice.stop();
  };

  const onSpeechStart = () => {
    console.log('Speech recognition started');
  };

  const onSpeechEnd = () => {
    console.log('Speech recognition ended');
  };

  const onSpeechResults = (e) => {
    const results = e.value;
    const confidence = e.meaning;
    const finalTranscript = results[0] || '';
    setTranscript(finalTranscript);
    setAccuracy(confidence);
    setWordCount(finalTranscript.split(' ').length);
    sendToServer(finalTranscript, language, confidence);
  };

  const onSpeechError = (e) => {
    console.error('Speech recognition error:', e.error);
    Alert.alert('Error', `Error occurred: ${e.error}`);
  };

  const sendToServer = (text, language, confidence) => {
    const timestamp = new Date().toISOString();

    axios.post('http://localhost:3000/api/save-transcription', {
      text,
      language,
      confidence,
      timestamp
    })
    .then(response => console.log('Server response:', response.data))
    .catch(error => console.error('Error sending to server:', error));
  };

  const clearText = () => {
    setTranscript('');
    setAccuracy(0);
    setWordCount(0);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <View style={[styles.container, theme === 'dark' && styles.darkMode]}>
      <Text style={styles.header}>Speech Transcription App</Text>

      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          value={transcript}
          multiline
          numberOfLines={4}
          editable={false}
        />
        <View style={styles.buttons}>
          <Button
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            onPress={isRecording ? stopRecording : startRecording}
          />
          <Button title="Clear" onPress={clearText} />
        </View>
      </View>

      <View style={styles.stats}>
        <Text>Time: {new Date(timer).toISOString().substr(11, 8)}</Text>
        <Text>Word Count: {wordCount}</Text>
        <Text>Accuracy: {accuracy}%</Text>
      </View>

      <View style={styles.settings}>
        <Text>Select Language</Text>
        <TextInput
          style={styles.input}
          value={language}
          onChangeText={setLanguage}
        />
        <View style={styles.themeSwitch}>
          <Text>Dark Mode</Text>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  darkMode: {
    backgroundColor: '#333',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  controls: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stats: {
    marginTop: 20,
    marginBottom: 20,
  },
  settings: {
    marginTop: 20,
  },
  themeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default App;
