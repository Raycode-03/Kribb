import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { useUserStore } from "../../../store/useStore";
import {Platform} from 'react-native'
import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons';

function Androidlayout() {
  const isAdmin = useUserStore((state)=>state.isAdmin);
function IOSlayout(){
  const isAdmin = useUserStore((store)=>state(state.isAdmin))
  return (
    <Tabs screenOptions={{headerShown: false}}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      {isAdmin && <Tabs.Screen name="create" />}
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

export default function TabsLayout(){
  return Platform.OS==="android"? <Androidlayout/> : <IOSlayout/>

}