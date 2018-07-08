/**
 * Created by wesleybrooks on 5/19/18.
 */
// SignUp.js
import React from 'react'
import { StyleSheet, Text, TextInput, View, Button, TouchableOpacity, ScrollView } from 'react-native'
import firebase from 'react-native-firebase'

export default class About extends React.Component {

    render() {
        return (
            <ScrollView>
                <View style={styles.container}>
                <View style={styles.modules}>
                <Text style={styles.welcome}>Welcome!</Text><Text style={styles.module}>Welcome to FireScreen, a Bondfire Product. FireScreen is a one of a kind automated interview screening.</Text>
                  <Text style={styles.module}>It is designed to quickly expose the most qualified candidates based on our proprietary ranking algorithm.</Text>
                  <Text style={styles.module}>Your answer to each question is converted from speech to text and fed into our ranking system.</Text>
                  <Text style={styles.module}>The text is then compared against answers desired by the interview sponsor and a score is generated.</Text>
                  <Text style={styles.module}>Candidates are then displayed to the sponsor by score, giving you maximum exposure for positions you are highly qualified for.</Text>
                <Text style={styles.welcome}>How It Works</Text><Text style={styles.module}>᛫ Please allow FireScreen access to your camera/microphone, if you have not done so already.</Text>
                  <Text style={styles.module}>᛫ To begin each recording click the green 'Start Recording' button.</Text>
                  <Text style={styles.module}>᛫ If the sponsor has not allowed question previews, the recording will start immediately after you click 'Begin' below.</Text>
                  <Text style={styles.module}>᛫ To end each recording click the red 'Stop Recording' button.</Text>
                  <Text style={styles.module}>᛫ After each recording you have 15 seconds to decide if you want to re-record your answer or accept it. You can re-record up to the max amount of attempts designated in the settings below.</Text>
                  <Text style={styles.module}>᛫ Your speech to text conversion will be displayed below the video player once you accept your recording. You have 1 minute to make any grammatical or spelling corrections you need at this moment.</Text>
                  <Text style={styles.module}>᛫ Note: Significant edits that change your intended answer can be viewed negatively when the sponsor\ reviews your video submissions.</Text>
                  <Text style={styles.module}>᛫ Once you are satisfied click next to move on to the next question.</Text>
                  <Text style={styles.module}>᛫ Again, if the sponsor has not allowed question previews, the recording will begin once you click "Next Question".</Text>
                  <Text style={styles.module}>᛫ Settings Explanation.</Text>
                    <Text style={styles.submodule}>✓ Attempts per Question is how many times you can record a video answering each question.</Text>
                    <Text style={styles.submodule}>✓ Max Answer Length is how long in seconds your answer can be per question.</Text>
                    <Text style={styles.submodule}>✓ Question Preview Time is how long you can view the question before beginning your answer. Once this alloted time has expired the recording will begin. If the sponsor has not allowed previews, then each recording will begin immediately.</Text>
                    <Text style={styles.submodule}>✓ All settings are determined by the interview sponsor.</Text>
                  <Text style={styles.instructions}>Please review the info and settings boxes below before beginning.</Text>
                  <Text style={styles.instructions}>Good Luck!</Text>
                  <TouchableOpacity style={styles.button}
                    onPress={() => this.props.navigation.navigate('Login')}
                  >
                    <Text style={{color:'white'}}>Back</Text>
                  </TouchableOpacity>}
                </View>
                </View>    
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    height: 80,
    marginBottom: 16,
    marginTop: 32,
    width: 80,
  },
  button: {
        flex: 0,
        backgroundColor: '#282828',
        borderRadius: 5,
        padding: 15,
        paddingHorizontal: 20,
        alignSelf: 'center',
        margin: 20
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
    margin: 10,
  },
  modules: {
    margin: 20,
  },
  module: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    textAlign: 'left',
  },
  submodule: {
    fontSize: 14,
    marginLeft: 20,
    marginTop: 4,
    lineHeight: 20,
    textAlign: 'left',
  }
})