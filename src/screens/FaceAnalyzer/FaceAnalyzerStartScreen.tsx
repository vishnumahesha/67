import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

interface FaceAnalyzerStartScreenProps {
  onStartScan: () => void;
}

interface RuleItemProps {
  icon: string;
  title: string;
  description: string;
}

const RuleItem: React.FC<RuleItemProps> = ({ icon, title, description }) => (
  <View style={styles.ruleItem}>
    <View style={styles.ruleIcon}>
      <Text style={styles.ruleIconText}>{icon}</Text>
    </View>
    <View style={styles.ruleContent}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <Text style={styles.ruleDescription}>{description}</Text>
    </View>
  </View>
);

export const FaceAnalyzerStartScreen: React.FC<FaceAnalyzerStartScreenProps> = ({
  onStartScan,
}) => {
  const captureRules = [
    {
      icon: '💡',
      title: 'Good Lighting',
      description: 'Face a window or soft light source. Avoid harsh overhead lighting.',
    },
    {
      icon: '📸',
      title: 'Use Back Camera',
      description: 'Back camera has less distortion than selfie camera.',
    },
    {
      icon: '📏',
      title: 'Step Back',
      description: 'Hold phone at arm\'s length to reduce lens distortion.',
    },
    {
      icon: '😐',
      title: 'Neutral Expression',
      description: 'Relax your face, look straight ahead with a neutral expression.',
    },
    {
      icon: '👓',
      title: 'Remove Accessories',
      description: 'Take off glasses and move hair away from your face.',
    },
    {
      icon: '↔️',
      title: 'Side Photo (Optional)',
      description: 'A side profile improves jaw and chin analysis accuracy.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Face Analyzer</Text>
          <Text style={styles.subtitle}>
            Get an honest assessment of your facial features with actionable insights
          </Text>
        </View>

        <View style={styles.calibrationNote}>
          <Text style={styles.calibrationIcon}>📊</Text>
          <View style={styles.calibrationContent}>
            <Text style={styles.calibrationTitle}>Honest Scoring</Text>
            <Text style={styles.calibrationText}>
              Our scoring is calibrated to a realistic distribution (mean ~5.5). 
              We avoid inflated scores—a 7+ is genuinely above average.
            </Text>
          </View>
        </View>

        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>Capture Guidelines</Text>
          <Text style={styles.sectionSubtitle}>
            Follow these tips for the most accurate analysis
          </Text>
          
          <View style={styles.rulesList}>
            {captureRules.map((rule, index) => (
              <RuleItem
                key={index}
                icon={rule.icon}
                title={rule.title}
                description={rule.description}
              />
            ))}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This analysis is for entertainment and self-improvement purposes only. 
            Results are approximate and should not be taken as medical advice.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartScan}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Scan</Text>
          <Text style={styles.startButtonIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    lineHeight: 24,
  },
  calibrationNote: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#00D9FF20',
  },
  calibrationIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  calibrationContent: {
    flex: 1,
  },
  calibrationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 4,
  },
  calibrationText: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 20,
  },
  rulesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  rulesList: {
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ruleIconText: {
    fontSize: 18,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  ruleDescription: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  disclaimer: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 17,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#111111',
  },
  startButton: {
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  startButtonIcon: {
    fontSize: 18,
    color: '#000000',
  },
});

export default FaceAnalyzerStartScreen;
