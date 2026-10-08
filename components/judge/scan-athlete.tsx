import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { HF } from '@/constants/hf';
import { parseQrPayload, STUB_PROFILE } from '@/constants/profile';

type ScannedAthlete = { athleteId: string; alias: string };

type Props = {
  onDone: (athlete: ScannedAthlete | null) => void;
};

/** Pre-judging step: scan the judged athlete's "My QR", or skip and stay anonymous. */
export function ScanAthlete({ onDone }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [selfError, setSelfError] = useState(false);
  const lockedRef = useRef(false);

  const startScan = async () => {
    setSelfError(false);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    lockedRef.current = false;
    setScanning(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (lockedRef.current) return;
    const payload = parseQrPayload(data);
    if (!payload) return; // not a SlideRep QR — keep scanning, no fuss
    if (payload.athleteId === STUB_PROFILE.athleteId) {
      setSelfError(true);
      return;
    }
    lockedRef.current = true;
    onDone({ athleteId: payload.athleteId, alias: payload.alias });
  };

  if (scanning) {
    return (
      <View style={styles.root}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        {selfError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>That&rsquo;s your own QR — scan the athlete&rsquo;s instead</Text>
          </View>
        )}
        <Pressable
          onPress={() => setScanning(false)}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, styles.center]}>
      <Text style={styles.title}>WHO ARE YOU JUDGING?</Text>
      {permission != null && !permission.granted && !permission.canAskAgain && (
        <Text style={styles.hint}>Camera access was denied — you can still continue anonymously.</Text>
      )}
      <Pressable
        style={({ pressed }) => [styles.scanBtn, pressed && styles.btnPressed]}
        onPress={startScan}
      >
        <Text style={styles.scanBtnText}>SCAN QR</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
        onPress={() => onDone(null)}
      >
        <Text style={styles.skipBtnText}>SKIP — ANONYMOUS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 24,
    color: HF.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scanBtn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
  },
  scanBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    color: HF.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  skipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.muted,
    letterSpacing: 1.5,
  },
  btnPressed: {
    opacity: 0.55,
  },
  camera: {
    flex: 1,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: `${HF.accent}dd`,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.ink,
    textAlign: 'center',
  },
  cancelBtn: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.ink,
    letterSpacing: 2,
  },
});
