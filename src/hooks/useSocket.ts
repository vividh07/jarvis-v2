import { useEffect } from 'react';
import { Alert } from 'react-native';
import { socketService } from '../services/socketService';
import { useJarvisStore } from '../store/useJarvisStore';
import { useChatStore } from '../store/useChatStore';
import { handleIncomingNotification } from '../services/notificationService';
import { useNotificationStore } from '../store/useNotificationStore';
import { useContactsStore } from '../store/useContactsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSpotifyStore } from '../store/useSpotifyStore';
import { isAuthenticated } from '../services/spotifyService';
import { draftWhatsAppMessage } from '../services/whatsappService';
import { ringPhone, stopRinging } from '../services/phoneService';

export const useSocket = () => {
  const setStatus = useJarvisStore(state => state.setStatus);
  const setConnected = useJarvisStore(state => state.setConnected);
  const setPCStats = useJarvisStore(state => state.setPCStats);
  const addMessage = useChatStore(state => state.addMessage);
  const refresh = useNotificationStore(state => state.refresh);

  useEffect(() => {
    const handleConnection = (data: any) => {
      if (data.status === 'disconnected') setConnected(false);
    };

    const handleResponse = (data: any) => {
      addMessage({
        id: Date.now().toString(),
        role: 'jarvis',
        text: data.text,
        timestamp: Date.now(),
      });
    };

    const handleStats = (data: any) => {
      setStatus({
        cpu: data.cpu,
        ram: data.ram,
        uptime: data.uptime,
        mode: data.mode || 'idle',
        model: data.llm_model || 'Groq',
      });
    };

    const handlePCStats = (data: any) => {
      setPCStats({
        git: data.git,
        window: data.window,
      });
    };

    const handleMode = (data: any) => {
      setStatus({ mode: data.mode });
    };

    const handleNotification = (data: any) => {
      handleIncomingNotification(data).then(() => refresh());
    };

    const handleSMS = (data: any) => {
      handleIncomingNotification({
        app: 'SMS',
        sender: data.sender,
        body: data.body,
      }).then(() => refresh());
    };

    const handleFindPhone = () => {
      ringPhone();
      setTimeout(() => stopRinging(), 10000);
    };

    const handleDraftWhatsApp = (data: any) => {
      const contact = useContactsStore.getState().findContact(data.contact);
      draftWhatsAppMessage(data.contact, data.message, contact?.phoneNumber);
    };

    const handleSpotifyPlay = async (data: { query?: string }) => {
      const query = data.query?.trim();
      if (!query) return;

      const spotifyLinked = useSettingsStore.getState().spotifyLinked;
      if (!spotifyLinked || !isAuthenticated()) {
        Alert.alert('Spotify', 'Link your Spotify account in Settings first.');
        return;
      }

      const trackName = await useSpotifyStore.getState().search(query);
      if (trackName) {
        useSpotifyStore.getState().setLinked(true);
        await useSpotifyStore.getState().fetchTrack();
      } else {
        Alert.alert('Spotify', `Couldn't find "${query}". Open Spotify on your PC and try again.`);
      }
    };

    socketService.on('connection', handleConnection);
    socketService.on('response', handleResponse);
    socketService.on('stats', handleStats);
    socketService.on('pc_stats', handlePCStats);
    socketService.on('mode', handleMode);
    socketService.on('notification', handleNotification);
    socketService.on('incoming_sms', handleSMS);
    socketService.on('find_phone', handleFindPhone);
    socketService.on('draft_whatsapp', handleDraftWhatsApp);
    socketService.on('spotify_play', handleSpotifyPlay);

    return () => {
      socketService.off('connection', handleConnection);
      socketService.off('response', handleResponse);
      socketService.off('stats', handleStats);
      socketService.off('pc_stats', handlePCStats);
      socketService.off('mode', handleMode);
      socketService.off('notification', handleNotification);
      socketService.off('incoming_sms', handleSMS);
      socketService.off('find_phone', handleFindPhone);
      socketService.off('draft_whatsapp', handleDraftWhatsApp);
      socketService.off('spotify_play', handleSpotifyPlay);
    };
  }, []);
};
