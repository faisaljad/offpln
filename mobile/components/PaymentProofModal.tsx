import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../services/api';

interface Props {
  visible: boolean;
  payment: { id: string; name: string; amount: number } | null;
  onClose: () => void;
  onSuccess: (updatedPayment: any) => void;
}

function formatCurrency(n: number) {
  return 'AED ' + new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);
}

export default function PaymentProofModal({ visible, payment, onClose, onSuccess }: Props) {
  const [file, setFile]       = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setFile(result.assets[0]);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open file picker' });
    }
  }

  async function handleSubmit() {
    if (!file || !payment) return;
    setUploading(true);
    try {
      const proofUrl = await api.uploadPaymentProof(
        file.uri,
        file.name,
        file.mimeType ?? 'application/octet-stream',
      );
      const updated = await api.submitPaymentProof(payment.id, proofUrl);
      Toast.show({ type: 'success', text1: 'Proof submitted', text2: 'Awaiting admin review' });
      setFile(null);
      onSuccess(updated);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setFile(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Proof of Payment</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Payment summary */}
        {payment && (
          <View style={styles.summary}>
            <Text style={styles.summaryName}>{payment.name}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(payment.amount)}</Text>
          </View>
        )}

        <Text style={styles.infoText}>
          Upload your payment receipt or bank transfer confirmation. Admin will review and approve it.
        </Text>

        {/* File pick zone */}
        <TouchableOpacity style={[styles.uploadZone, file && styles.uploadZoneFilled]} onPress={pickFile}>
          {file ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={32} color="#2563eb" />
              <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
              <Text style={styles.fileSize}>{((file.size ?? 0) / 1024).toFixed(1)} KB</Text>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          ) : (
            <View style={styles.uploadPrompt}>
              <Ionicons name="cloud-upload-outline" size={40} color="#9ca3af" />
              <Text style={styles.uploadTitle}>Choose a file</Text>
              <Text style={styles.uploadSub}>PDF, JPG, PNG supported</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={uploading}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, (!file || uploading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Proof</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  title:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },

  summary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: 20, padding: 16, backgroundColor: '#f0fdf4',
    borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0',
  },
  summaryName:   { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  summaryAmount: { fontSize: 16, fontWeight: '700', color: '#059669' },

  infoText: {
    marginHorizontal: 20, marginBottom: 20,
    fontSize: 13, color: '#6b7280', lineHeight: 18,
  },

  uploadZone: {
    marginHorizontal: 20, height: 160,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  uploadZoneFilled: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },

  uploadPrompt: { alignItems: 'center', gap: 6 },
  uploadTitle:  { fontSize: 15, fontWeight: '600', color: '#374151' },
  uploadSub:    { fontSize: 12, color: '#9ca3af' },

  fileInfo:   { alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  fileName:   { fontSize: 14, fontWeight: '600', color: '#2563eb', textAlign: 'center' },
  fileSize:   { fontSize: 11, color: '#6b7280' },
  changeText: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  actions: { flexDirection: 'row', gap: 12, padding: 20, marginTop: 'auto' },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#2563eb', alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
