import { Linking } from 'react-native';

export const draftWhatsAppMessage = async (
  contactName: string,
  message: string,
  phoneNumber?: string
): Promise<boolean> => {
  try {
    const encodedMessage = encodeURIComponent(message);

    let url: string;
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      url = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    } else {
      url = `whatsapp://send?text=${encodedMessage}`;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (e) {
    console.error('WhatsApp draft error:', e);
    return false;
  }
};
