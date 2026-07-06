import { Redirect } from 'expo-router';
import '../global.css';

// Redirect root to the tabs group
export default function Root() {
  return <Redirect href="/(tabs)" />;
}
