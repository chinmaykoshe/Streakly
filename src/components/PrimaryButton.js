import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { CheckCircle2, Circle } from 'lucide-react-native';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Primary CTA button — used for "Mark as Sent".
 * Supports loading, done, and default states with spring press animation.
 */
export function PrimaryButton({ onPress, done = false, loading = false, label, doneLabel }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.94), withSpring(1));
    onPress?.();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={done || loading}
      style={[
        animStyle,
        {
          borderRadius: 18,
          paddingVertical: 16,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: done ? 'rgba(76,175,80,0.15)' : '#FFB000',
          borderWidth: done ? 1.5 : 0,
          borderColor: done ? 'rgba(76,175,80,0.4)' : 'transparent',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={done ? '#4CAF50' : '#121212'} />
      ) : done ? (
        <>
          <CheckCircle2 color="#4CAF50" size={22} />
          <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 17, marginLeft: 8 }}>
            {doneLabel || 'Completed'}
          </Text>
        </>
      ) : (
        <>
          <Circle color="#121212" size={20} />
          <Text style={{ color: '#121212', fontWeight: '700', fontSize: 17, marginLeft: 8 }}>
            {label || 'Mark as Sent'}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}
