import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform, CameraRoll, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [step, setStep] = useState(1); // Current step in the process

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      Alert.alert(
        'Confirm Image',
        'Are you sure you want to use this image?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: () => savePicture(photo),
          },
        ],
        { cancelable: false }
      );
    }
  };

  const savePicture = async (photo) => {
    const filename = FileSystem.documentDirectory + `captured_photo_${capturedPhotos.length + 1}.jpg`;
    await FileSystem.copyAsync({
      from: photo.uri,
      to: filename,
    });
    setCapturedPhotos([...capturedPhotos, filename]);
    if (capturedPhotos.length === 0) {
      // If it's the first image, request barcode image next
      setStep(2);
    } else {
      // Otherwise, log the captured photos
      console.log('Captured Photos:', capturedPhotos);
    }

    // Save the image to the gallery
    if (Platform.OS === 'android') {
      saveToGallery(photo.uri);
    }
  };

  const saveToGallery = async (uri) => {
    try {
      await CameraRoll.saveToCameraRoll(uri, 'photo');
      console.log('Image saved to gallery');
    } catch (error) {
      console.log('Error saving image to gallery:', error);
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
    setCurrentLocation(location.coords); // Update currentLocation state
  };

  const handleConfirmFirstImage = () => {
    // Move to the next step (capturing the barcode image)
    setStep(2);
  };

  const handleSubmit = () => {
    // Move to the next step (submitting the data)
    setStep(3);
    // Here you can implement your submission logic
  };

  return (
    <View style={styles.container}>
      {hasPermission === null ? (
        <Text>Requesting Permissions...</Text>
      ) : hasPermission === false ? (
        <Text>No access to camera and location</Text>
      ) : step === 1 ? (
        // Step 1: Capture product image
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
      ) : step === 2 ? (
        // Step 2: Capture barcode image
        <View style={styles.cameraContainer}>
          <Camera
            ref={(ref) => setCameraRef(ref)}
            style={styles.camera}
            type={Camera.Constants.Type.back}
          />
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Take Barcode Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Step 3: Submit data
        <View style={styles.submitContainer}>
          <Text>Data Submitted Successfully!</Text>
        </View>
      )}
      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text>Latitude: {currentLocation.latitude}</Text>
          <Text>Longitude: {currentLocation.longitude}</Text>
        </View>
      )}
      <View style={styles.imagesContainer}>
        {capturedPhotos.map((photo, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: photo }} style={styles.capturedImage} />
          </View>
        ))}
      </View>
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
    position: 'relative',
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
  submitButton: {
    position: 'absolute',
    bottom: 20,
    left: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 50,
    padding: 15,
  },
  buttonText: {
    fontSize: 20,
  },
  locationContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  imageContainer: {
    margin: 5,
  },
  capturedImage: {
    width: 100,
    height: 100,
  },
  submitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
