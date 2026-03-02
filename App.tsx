import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import EquipmentScreen from './src/screens/EquipmentScreen';

export type RootStackParamList = {
  Equipment: undefined;
  Home: undefined;
  Workout: { workoutId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Equipment"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Equipment" component={EquipmentScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
