import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Keyboard,
  Platform,
  Animated,
  StyleSheet,
  EmitterSubscription,
} from 'react-native';

interface FloatingInputContainerProps {
  children: React.ReactNode;
  offset?: number;
  withShadow?: boolean;
  animationDuration?: number;
}

const FloatingInputContainer: React.FC<FloatingInputContainerProps> = ({
  children,
  offset = 10,
  withShadow = true,
  animationDuration = 250,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener: EmitterSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Only move up if an input is actually focused
        if (isInputFocused) {
          Animated.timing(slideAnim, {
            toValue: -e.endCoordinates.height - offset,
            duration: animationDuration,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    const keyboardDidHideListener: EmitterSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
        setIsInputFocused(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [offset, slideAnim, animationDuration, isInputFocused]);

  // Add focus/blur handlers to children
  const childrenWithHandlers = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onFocus: () => setIsInputFocused(true),
        onBlur: () => setIsInputFocused(false),
      });
    }
    return child;
  });

  return (
    <Animated.View
      style={[
        styles.container,
        withShadow && styles.shadow,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {childrenWithHandlers}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default FloatingInputContainer;