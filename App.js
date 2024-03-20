import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform, Alert, Button } from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera/next';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [step, setaStep] = useState(1); // Current step in the process
  const [productImageTaken, setProductImageTaken] = useState(false); // Track if product image has been taken
  const [barcodeImageTaken, setBarcodeImageTaken] = useState(false); // Track if barcode image has been taken

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
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

  const handleBarCodeScanned = ({ type, data }) => {
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    setBarcodeImageTaken(true);
    setaStep(3); // Move to the next step after scanning barcode
    handleSubmit();
  };

  const savePicture = async (photo) => {
    const filename = FileSystem.documentDirectory + `captured_photo_${capturedPhotos.length + 1}.jpg`;
    await FileSystem.copyAsync({
      from: photo.uri,
      to: filename,
    });
    setCapturedPhotos([...capturedPhotos, filename]);

    if (!productImageTaken) {
      // If product image is not taken yet, mark it as taken and set step to 2
      setProductImageTaken(true);
      setaStep(2);
    }

    // Save the image to the gallery
    if (Platform.OS === 'android') {
      saveToGallery(photo.uri);
    }
  };

  const saveToGallery = async (uri) => {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      console.log('Image saved to gallery');
    } catch (error) {
      console.log('Error saving image to gallery:', error);
    }
  };

  const handleSubmit = async () => {
    // Get location before showing alert
    const location = await getLocation();
    setCurrentLocation(location); // Update currentLocation state
    // Move to the next step (submitting the data)
    setaStep(3);
  };
  
  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return null;
    }
  
    let location = await Location.getCurrentPositionAsync({});
    console.log('Location:', location.coords);
    return location.coords; // Return the location coordinates
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
          <TouchableOpacity style={styles.button} onPress={takePicture} disabled={productImageTaken}>
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>
        </View>
      ) : step === 2 ? (
        // Step 2: Capture barcode image
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "pdf417"
            ],
            }}
            style={StyleSheet.absoluteFillObject}
          />
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
  barcodeContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '70%',
    height: '70%',
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
  container2: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
});
