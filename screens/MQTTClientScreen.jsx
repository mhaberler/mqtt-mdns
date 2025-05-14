import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { disconnect, onMessage, publish, setupMqtt, subscribe, isConnected } from "../mqtt.js";

const MQTTClientScreen = ({ route, navigation }) => {
  // Holds the mqtt.js client instance across renders
  const clientRef = useRef(null);
  const { addresses, domain, hostName, name, port, txt, type } = route.params;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const wsPatterns = ['_mqtt-ws._tcp.', '_mqtt-wss._tcp.'];
  const tlsPatterns = ['_mqtts._tcp.', '_mqtt-wss._tcp.'];

  const topicName = "#";

  useEffect(() => {
    connectToMQTT();
    // Clean up on unmount
    return () => {
      if (clientRef.current && isConnected(clientRef.current)) {
        disconnect(clientRef.current);
      }
    };
  }, []);

  const onConnect = (client) => {
    setConnected(true);
    setConnecting(false);

    // Subscribe to all topics
    try {
      subscribe(client, topicName);
      addMessage('system', 'Connected and subscribed to all topics (#)');

    } catch (err) {
      setError(`Failed to subscribe: ${err.message}`);
    }
  };

  const onConnectionError = (client, err) => {
    setMessages((prev) => [...prev, `Error: ${err.message}`]);
    setError(`Failed to create client: ${err.message}`);
    setConnecting(false);
  };

  const onConnectionLost = () => {
    setConnected(false);
    setConnecting(false);
    setMessages((prev) => [...prev, `Connection lost`]);
  };

  const connectToMQTT = async () => {
    setConnecting(true);
    setError(null);

    const serverAddress = addresses && addresses.length > 0 ? addresses[0] : hostName;
    try {
      clientRef.current = await setupMqtt({
        url: serverAddress,
        port: port,
        tls: tlsPatterns.some(pattern => type.includes(pattern)),
        connectionType: wsPatterns.some(pattern => type.includes(pattern)) ? "Websocket" : "TCP",
        username: "",
        password: "",
        onConnect: onConnect,
        onClose: onConnectionLost,
        onConnectionError: onConnectionError
      });
    } catch (err) {
      setError(`Connection failed: ${err}`);
      setConnecting(false);
      return;
    }

    onMessage(clientRef.current, (topic, message) => {
      let payload;
      // Try to parse the payload as JSON
      try {
        payload = JSON.parse(message);
        payload = JSON.stringify(payload, null, 2); // Format JSON for display
      } catch (e) {
        payload = message;
      }
      addMessage(topic, payload);
    });

    setMessages((prevMessages) => [
      ...prevMessages,
      "Connected to broker: " + serverAddress,
      "Subscribed to topic: " + topicName,
    ]);
  };

  const addMessage = (topic, payload) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prevMessages => [
      {
        id: `${timestamp}-${Math.random().toString(16).substr(2, 8)}`,
        topic,
        payload,
        timestamp,
      },
      ...prevMessages,
    ].slice(0, 100)); // Keep only the last 100 messages
  };

  const disconnectClient = () => {
    if (clientRef.current && isConnected(clientRef.current)) {
      disconnect(clientRef.current);
      addMessage('system', 'Disconnected from broker');
    }
    setConnected(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.messageItem}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageTopic}>{item.topic}</Text>
        <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
      </View>
      <Text style={styles.messagePayload}>{item.payload}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionText}>
            {connecting ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}
          </Text>
          <View style={[
            styles.connectionStatus,
            connected ? styles.connected : connecting ? styles.connecting : styles.disconnected
          ]} />
        </View>

        <TouchableOpacity
          style={[styles.button, connected ? styles.disconnectButton : styles.connectButton]}
          onPress={connected ? disconnectClient : connectToMQTT}
          disabled={connecting}
        >
          <Text style={styles.buttonText}>
            {connected ? 'Disconnect' : connecting ? 'Connecting...' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {connecting && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Connecting to MQTT broker...</Text>
        </View>
      )}

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {connected ? 'Waiting for messages...' : 'Connect to start receiving messages'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  connectionStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  connecting: {
    backgroundColor: '#FFC107',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    elevation: 1,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  errorText: {
    color: '#D32F2F',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  list: {
    padding: 8,
  },
  messageItem: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageTopic: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#757575',
  },
  messagePayload: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
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

export default MQTTClientScreen;