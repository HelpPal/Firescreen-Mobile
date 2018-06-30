// Main.js
import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button,
    TextInput, Alert, TouchableOpacity} from 'react-native'
import firebase from 'react-native-firebase'

export default class Main extends React.Component {
    state = { currentUser: null, accessCode:'-LGDPsQ_wJHdeiAFuR7h',fireCode:'-Kn1dkvvpV3J_qU-LIHy' };
    userData = {};


    componentDidMount() {
        const { currentUser } = firebase.auth();
        console.log("mount currentUser: ",currentUser);
        this.setState({ currentUser });
        this.getUserData(currentUser);
    }

    render() {
        const { currentUser } = this.state;
        return (
            <View style={styles.container}>
                <Text style={styles.text}>
                    Welcome {currentUser && currentUser.email}!
                </Text>
                {this.state.errorMessage &&
                <Text style={styles.text}>
                    {this.state.errorMessage}
                </Text>}
                <TextInput
                    style={styles.textInput}
                    autoCapitalize="none"
                    placeholder="Fire Code"
                    returnKeyLabel="done"
                    onChangeText={fireCode => this.setState({ fireCode })}
                    value={this.state.fireCode}
                />
                <TextInput
                    style={styles.textInput}
                    autoCapitalize="none"
                    placeholder="Access Code"
                    returnKeyLabel="done"
                    onChangeText={accessCode => this.setState({ accessCode })}
                    value={this.state.accessCode}
                />
                <TouchableOpacity
                        onPress={()=>{this.props.navigation.navigate('Interview',{
                            accessCode:this.state.accessCode,
                            fireCode:this.state.fireCode,
                            userData: this.userData
                        })}}
                        style={styles.button}
                >
                    <Text style={styles.text}>Access Interview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={()=>{this.handleLogout()}}
                >
                    <Text style={styles.text}>Logout</Text>
                </TouchableOpacity>
            </View>
        )
    }

    handleLogout(){
        firebase
            .auth()
            .signOut()
            .then(() => this.props.navigation.navigate('Login'))
            .catch(error => this.setState({errorMessage: error.message}))
    }

    getUserData(currentUser){
        console.log("userData currentUser: ",currentUser);

        firebase.database().ref("candidates")
            .orderByChild("id")
            .equalTo(currentUser.uid)
            .limitToFirst(1)
            .once("value")
            .then((snapshot)=> {
                console.log("User data snapshot:", snapshot);
                if (snapshot._childKeys.length > 0) {
                    this.userData = snapshot.val()[snapshot._childKeys[0]];
                    console.log("UserData: ",this.userData);
                } else {
                    Alert.alert(
                        "Account Not Found",
                        "Candidate account not found, the Firescreen app is only for candidates. If you are a sponsor please login from a web browser at firescreen.bondfires.com.",
                        [
                            {text: 'OK', onPress: () => console.log('OK Pressed')},
                        ],
                        { cancelable: false }
                    );
                    this.handleLogout();
                }
            });
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d9230f'
    },
    textInput: {
        height: 40,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginTop: 8,
        backgroundColor: 'white'
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
    text: {
        color: 'white'
    }
});