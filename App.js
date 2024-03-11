import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      savePicture(photo);
      getLocation();
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }
  
    let location = await Location.getCurrentPositionAsync({});
    console.log('Location:', location.coords);
  };

  const savePicture = async (photo) => {
    const filename = FileSystem.documentDirectory + 'captured_photo.jpg';
    await FileSystem.copyAsync({
      from: photo.uri,
      to: filename,
    });
    setCapturedPhoto(filename);
  };

  return (
    <View style={styles.container}>
      {hasPermission === null ? (
        <Text>Requesting Camera Permission</Text>
      ) : hasPermission === false ? (
        <Text>No access to camera</Text>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            ref={(ref) => setCameraRef(ref)}
            style={styles.camera}
            type={Camera.Constants.Type.back}
          />
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>
        </View>
      )}
      {capturedPhoto && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    left: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 50,
    padding: 15,
  },
  buttonText: {
    fontSize: 20,
  },
  imageContainer: {
    marginTop: 30,
  },
  capturedImage: {
    width: 300,
    height: 300,
  },
});

//12.934702151544084,77.59296663008456