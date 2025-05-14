// src/screens/ScannerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert
} from 'react-native';
import {
  addEventListener,
  startSearch,
  stopSearch,
} from '@inthepocket/react-native-service-discovery';

const ScannerScreen = ({ navigation }) => {
  const [services, setServices] = useState({});
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceTypes, setserviceTypes] = useState([
    { name: 'mqtt', enabled: true },
    { name: 'mqtt-ws', enabled: true },
    { name: 'mqtts', enabled: true },
    { name: 'mqtt-wss', enabled: true },
  ]);

  let timerRef = useRef(null);

  useEffect(() => {
    // Event listeners for zeroconf
    addEventListener('serviceFound', service => {
      console.log('serviceFound:', service);

      setServices(prevServices => ({
        ...prevServices,
        [service.name + " " + service.type]: service
      }));
    });

    // Initial scan on component mount
    startScan();

    // Cleanup on unmount
    return () => {
      clearTimeout(timerRef.current);
      serviceTypes.map((s) => {
        stopSearch(s.name);
      });
    };
  }, []);

  const startScan = () => {
    try {
      setScanning(true);
      setServices({});

      serviceTypes.map((s) => {
        if (s.enabled) {
          startSearch(s.name);
        }
      });

      // Set a timeout to stop scanning after 10 seconds
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        if (scanning) {
          serviceTypes.map((s) => {
            if (s.enabled) {
              stopSearch(s.name);
            }
          });
          setScanning(false);
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to start scan:', error);
      setScanning(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    startScan();
    setRefreshing(false);
  };

  const stopScan = () => {
    serviceTypes.map((s) => {
      stopSearch(s.name);
    });
    setScanning(false);
  };

  const handleServicePress = (service) => {
    // Navigate to MQTT client screen with service details
    navigation.navigate('MQTTClient', service);
  };

  const renderItem = ({ item }) => {
    const service = services[item];

    return (
      <TouchableOpacity
        style={styles.serviceItem}
        onPress={() => handleServicePress(service)}
      >
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text>Type: {service.type}</Text>
        <Text>Host: {service.host}</Text>
        <Text>Port: {service.port}</Text>
        <Text>Addresses: {service.addresses?.join(', ')}</Text>
        <Text style={styles.tapHint}>Tap to connect</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.button, scanning ? styles.stopButton : styles.startButton]}
          onPress={scanning ? stopScan : startScan}
        >
          <Text style={styles.buttonText}>{scanning ? 'Stop' : 'Scan'}</Text>
        </TouchableOpacity>
      </View>

      {scanning && (
        <View style={styles.scanningContainer}>
          <Text style={styles.scanningText}>Scanning for MQTT services...</Text>
        </View>
      )}

      <FlatList
        data={Object.keys(services)}
        renderItem={renderItem}
        keyExtractor={item => item}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {scanning ? 'Looking for services...' : 'No services found. Pull down to refresh.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    elevation: 1,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scanningContainer: {
    padding: 12,
    backgroundColor: '#FFF9C4',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  scanningText: {
    color: '#FF8F00',
    fontWeight: '500',
  },
  list: {
    padding: 8,
  },
  serviceItem: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  tapHint: {
    marginTop: 8,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
  },
});

export default ScannerScreen;