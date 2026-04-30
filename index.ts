import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';

import App from './App';
import { AlarmRingScreenStandalone } from './src/screens/AlarmRingScreenStandalone';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Register AlarmRingScreen as a separate component for AlarmRingActivity
// This allows it to be launched independently over the lock screen
AppRegistry.registerComponent('AlarmRingScreen', () => AlarmRingScreenStandalone);
