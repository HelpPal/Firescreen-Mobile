import React from 'react'
import { StyleSheet, Text, TextInput, View, Button, Alert, TouchableOpacity } from 'react-native'
import firebase from 'react-native-firebase'
import HTMLView from 'react-native-htmlview';
import Moment from 'moment'
import { PermissionsAndroid } from 'react-native';
import Voice from 'react-native-voice';
import { RNCamera } from 'react-native-camera';

export default class Interview extends React.Component {
    state = {
        fireScreenResponse: {},
        fireScreen: {},
        testText: 'Loading...',
        accessCode: '',
        fireCode: '',
        currentUser: null,
        currentQuestion: 'No question yet.',
        diffDate: new Date(),
        acceptCountdown: 15,
        transcriptCountdown: 60,
        recording:false,
        displayHelpTimers:true,
        transcriptEnabled:false,
        allowPreview:true,
        interviewState: "begin",
        savingVideo: false,
        speechData: "",
        //Voice vars
        recognized: '',
        pitch: '',
        error: '',
        started: '',
        results: [],
        partialResults: [],
        end: ''
    };
    allowSave = false;
    //savingVideo = false;
    //interviewState = "begin";
    userData = {};
    timerFD = null;
    futureDate = new Date();
    //allowPreview = true;
    //transcriptEnabled = false;
    acceptCountdown = 15;
    transcriptCountdown = 60;
    acceptFD;
    transcriptFD;
    //displayHelpTimers = true;
    previewTime;
    answerTime;
    maxAttempts = -1;
    speechData = "";
    //recording = false;
    constructor(props){
        super(props);
        Voice.onSpeechStart = this.onSpeechStart.bind(this);
        Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
        Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
        Voice.onSpeechError = this.onSpeechError.bind(this);
        Voice.onSpeechResults = this.onSpeechResults.bind(this);
        Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
        Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged.bind(this);
    }

    componentWillUnmount() {
        Voice.destroy().then(Voice.removeAllListeners);
    }

    componentDidMount(){
        const accessCode = this.props.navigation.getParam('accessCode', '');
        const fireCode = this.props.navigation.getParam('fireCode', '');
        this.userData = this.props.navigation.getParam('userData',{});
        const { currentUser } = firebase.auth();
        this.setState({ currentUser,accessCode,fireCode });
        console.log("Did Mount State: ",this.state);
        this.initializeInterview(accessCode,fireCode,this);

        //TODO is this needed for Android? I've only tested on iOS.
        /*requestAudioPermission(this.props).then(()=>{
            this.initializeInterview(accessCode,fireCode,this);
        }, err=>{
            console.log("Audio Permission error: ",err);
            this.props.navigation.navigate("Main");
        })*/


    }


    render() {
        //TODO can we display the html string 'beginCard' (at bottom of this file) in the begin state in a readable format?
        //TODO the TouchableOpacity button should be underneath the text in the html.
        if(this.state.interviewState === 'begin'){
            return (
                <View style={styles.container}>
                    <Text style={styles.text}>{this.state.testText}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.beginInterview()}
                    >
                        <Text>Begin</Text>
                    </TouchableOpacity>
                </View>

            )
        } else if (this.state.interviewState === 'interview' && !this.state.recording){
            return (
                <View style={styles.container}>

                    {(!this.state.currentQuestion.data) ?
                    <Text style={styles.text}>
                        {(!this.state.allowPreview) ? 'No Question Preview' : (this.previewTime == -1) ? 'Unlimited Question Preview' : 'Preview Question: '+Moment(this.state.diffDate).format('mm:ss')+' '}
                    </Text>
                        : null}

                    {(!this.state.currentQuestion.data) ?
                    <Text style={styles.text}>{this.state.currentQuestion.question}</Text>
                        : null}

                    {(!this.state.recording && !this.state.transcriptEnabled
                        && this.state.currentQuestion.data && this.state.displayHelpTimers) ?
                        <Text style={styles.text}>You have {this.state.acceptCountdown} seconds to accept your recording or re-record it.</Text>
                        : null}

                    {(!this.state.recording && this.state.transcriptEnabled
                        && this.state.currentQuestion.data && this.state.displayHelpTimers) ?
                        <Text style={styles.text}>You have {this.state.transcriptCountdown} seconds to edit your transcript.</Text>
                        : null}

                    {(!this.state.recording && !this.state.transcriptEnabled
                    && this.state.currentQuestion.data && this.state.displayHelpTimers) ?
                        <Text style={styles.text}>Attempts: {(this.maxAttempts == -1) ? "Unlimited" : this.state.currentQuestion.attempt +"/"+this.maxAttempts}</Text>
                        : null}
                    {(!this.state.recording && !this.state.transcriptEnabled
                        && this.state.displayHelpTimers) ?
                        <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.autoStartRecording()}
                        >
                            <Text>{(this.state.currentQuestion.data) ? 'Restart Recording' : 'Start Recording'}</Text>
                        </TouchableOpacity>
                        : null}

                    {(!this.state.recording && !this.state.transcriptEnabled
                        && this.state.currentQuestion.data && this.state.displayHelpTimers) ?
                        <TouchableOpacity
                        style={styles.button}
                        onPress={() => {this.setState({transcriptEnabled:true}); this.startTranscriptTimer()}}
                        >
                            <Text>Accept Recording</Text>
                        </TouchableOpacity>
                        : null}

                    {(this.state.currentQuestion.data && this.state.transcriptEnabled) ?
                        <Text style={styles.text}>Transcript: Edit grammar or spelling errors here after accepting a recording.</Text>
                        : null}
                    {(this.state.currentQuestion.data && this.state.transcriptEnabled) ?
                        <TextInput
                        placeholder="Transcript"
                        autoCapitalize="none"
                        multiline={true}
                        returnKeyLabel="done"
                        blurOnSubmit={true}
                        style={styles.textInput}
                        onChangeText={speechData => this.setState({speechData})}
                        value={this.state.speechData}
                        />
                        : null}
                    {(this.state.currentQuestion.data && this.state.transcriptEnabled) ?
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {this.nextQuestion(); this.setState({transcriptEnabled:false});}}
                    >
                        <Text>Next Question</Text>
                    </TouchableOpacity>
                        : null}

                </View>
            )

        }
        //TODO we need to add the countdown timer inside the camera view somewhere
        //TODO there is a dummy 00:00 placeholder in there now. Feel free to remove and put the timer at the top or bottom.
        else if (this.state.interviewState === 'interview' && this.state.recording){
            return(
                <View style={styles.cameraContainer}>

                    <RNCamera
                        ref={ref => {
                            this.camera = ref;
                        }}
                        style = {styles.preview}
                        type={RNCamera.Constants.Type.front}
                        flashMode={RNCamera.Constants.FlashMode.auto}
                        captureAudio={true}
                        fixOrientation={true}
                        onCameraReady={()=>{console.log("Camera ready handler fired.");this.cameraReady();}}
                        permissionDialogTitle={'Permission to use camera'}
                        permissionDialogMessage={'We need your permission to use your camera phone'}
                    />
                    <View style={styles.controlsContainer}>
                        <Text style={{color: 'white', alignSelf:'center'}}>{this.state.currentQuestion.question}</Text>
                        <TouchableOpacity
                            onPress={()=>{this.autoStopRecording(); this.startAcceptCountdown()}}
                            style = {styles.capture}
                        >
                            <Text style={{fontSize: 14, color:'white'}}> Stop Recording </Text>
                        </TouchableOpacity>
                        <Text style={{color:'white',alignSelf:'center',marginTop:7}}>00:00</Text>
                    </View>
                </View>
            )
        }

        else if (this.state.interviewState === 'end'){
            return (
                <View style={styles.container}>
                    <Text style={styles.text}>Interview Completed</Text>
                    <Text style={styles.text}>Score: {this.state.fireScreenResponse.score}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {this.endInterview();}}
                    >
                        <Text>Submit Interview</Text>
                    </TouchableOpacity>
                </View>
            )
        } else {
            return (
                <View style={styles.container}>
                    <Text>{"In an unkown state..."}</Text>

                </View>
            )
        }


    }

    initializeInterview(accessCode, fireCode, component){
        console.log('accessCode: '+accessCode+' fireCode: '+fireCode);
        firebase.database().ref("fireScreenResponses")
            .orderByChild("accessCode")
            .equalTo(accessCode)
            .limitToFirst(1)
            .once("value")
            .then((snapshot)=> {
                console.log("Response snapshot:",snapshot);
                if(snapshot.val()[accessCode]){
                    /*component.setState({
                        testText: 'Found ScreenResponse.',
                        fireScreenResponse: snapshot.val()[accessCode]
                    });*/
                    component.loadFireScreenResponse(snapshot.val()[accessCode],component);

                    firebase.database().ref("fireScreens")
                        .orderByChild('id')
                        .equalTo(fireCode)
                        .limitToFirst(1)
                        .once('value')
                        .then((snapshot)=>{
                            console.log("Firescreen snapshot: ",snapshot);
                            if(snapshot.val()[fireCode]){
                                /*component.setState({
                                    testText: 'Found ScreenResponse and Screen.',
                                    fireScreen: snapshot.val()[fireCode]
                                });*/
                                component.loadFireScreen(snapshot.val()[fireCode],component);
                            }
                            else {
                                component.setState({testText: 'ScreenResponse found, No Screen'})
                            }
                        }, (error)=>{
                            component.setState({testText: 'Screen Not Found with Error: '+error.message})
                        })
                }else {
                    component.setState({testText:  'ScreenResponse Not Found'});
                }
        }, (error)=>{
            component.setState({testText:  'ScreenResponse Not Found With Error: '+error.message});
            //this.setState({errorMessage: error.message});
        });
    }

    loadFireScreenResponse(fireScreenResponse, component){
        if(fireScreenResponse.candidateId){
            if(fireScreenResponse.candidateId != component.userData.id){
                //alert("This is another user's FireScreen. Returning to access screen.");
                Alert.alert(
                    "Wrong Access Code",
                    "This is another user's FireScreen, please contact your sponsor for the correct code. Returning to access screen.",
                    [
                        {text: 'OK', onPress: () => console.log('OK Pressed')},
                    ],
                    { cancelable: false }
                );
                component.props.navigation.navigate("Main");
            }

        } else{
            fireScreenResponse.candidateId = component.userData.id;

            let now = new Date();
            let expirationTimeNumber = fireScreenResponse.expirationTimeNumber;
            if(fireScreenResponse.expireInvite && expirationTimeNumber && now.getTime() > expirationTimeNumber){
                fireScreenResponse.status = "Expired";
                //alert("This interview invite has expired. If you think this is an error please contact your interview sponsor. Returning to access screen.");
                Alert.alert(
                    "Expired Access Code",
                    "This interview invite has expired. If you think this is an error please contact your interview sponsor. Returning to access screen.",
                    [
                        {text: 'OK', onPress: () => console.log('OK Pressed')},
                    ],
                    { cancelable: false }
                );

                this.saveResponse(fireScreenResponse);
                component.props.navigation.navigate("Main");
            }

            if(fireScreenResponse.status === "Not Accessed"){
                fireScreenResponse.status = "Started";
            }

            this.saveResponse(fireScreenResponse);

        }

        component.setState({
            testText: 'Found ScreenResponse.',
            fireScreenResponse: fireScreenResponse
        });
        console.log("response: ",fireScreenResponse);

        if(fireScreenResponse.status === "Completed"){
            //alert("You have already submitted this FireScreen. It can no longer be accessed.");
            Alert.alert(
                "Interview Completed",
                "You have already submitted this FireScreen, it can no longer be accessed. Returning to access screen.",
                [
                    {text: 'OK', onPress: () => console.log('OK Pressed')},
                ],
                { cancelable: false }
            );
            component.props.navigation.navigate("Main");
        }

    }

    loadFireScreen(fireScreen, component){
        let fireScreenResponse = component.state.fireScreenResponse;

        if (! (fireScreenResponse.questionPairs)){
            fireScreenResponse.questionPairs = fireScreen.questionPairs;
            //this.questions = fireScreenResponse.questionPairs;

            component.initQuestionPairs(fireScreenResponse.questionPairs);
            component.saveResponse(fireScreenResponse);
        }
        else {
            //this.questions = fireScreenResponse.questionPairs;
        }

        //Setup state
        this.initState(fireScreenResponse.questionPairs,component);
        console.log("Firescreen: ",fireScreen);
        //Setup interview settings
        this.state.allowPreview = fireScreen.allowPreview == true;
        console.log("Allow preview: ",this.state.allowPreview);
        this.previewTime = fireScreen.previewTime;
        this.answerTime = fireScreen.answerTime;
        this.maxAttempts = fireScreen.maxAttempts;
       /*
        this.candidate = fireScreenResponse.name;
        this.interviewTitle = fireScreen.title;
        this.company = fireScreen.sponsor; */


        if(component.state.interviewState === "interview")
            this.startPreviewTimer();

        console.log("Response after setup", fireScreenResponse);
        component.setState({
            testText: 'Found ScreenResponse and Screen.',
            fireScreen: fireScreen
        });
    }

    initQuestionPairs(questions){
        for(let i = 0; i < questions.length; i++){
            questions[i].id = i;
            questions[i].completed = false;
            questions[i].started = false;
            questions[i].attempt = 0;
        }
    }

    initState(questions,component){
        let noCompletedQuestions = true;
        let allQuestionsCompleted = true;
        if(questions.length > 0){
            //this.selectedQuestion = this.questions[0];
            for(let i = 0; i< questions.length; i++){
                let question = questions[i];
                if(!question.completed){
                    console.log("q not completed.",question);
                    if(i == 0){
                        component.state.currentQuestion = question;
                    } else {
                        console.long("interview state.");
                        component.setState({
                            currentQuestion: question,
                            interviewState: 'interview'
                        });
                    }

                    //component.activeId = question.id;
                    allQuestionsCompleted = false;
                    break;
                }
                else{
                    console.log("q completed.");
                    noCompletedQuestions = false;
                }
            }
        }
        if(noCompletedQuestions){
            component.setState({interviewState:'begin'});
            component.activeId = -1;
            console.log('begin state.')
        }
        if(allQuestionsCompleted){
            component.setState({interviewState:'end'});
            this.activeId = -2;
            console.log('end state.')
        }

    }

    beginInterview(){
        Alert.alert(
            "Are You Sure?",
            "Are you sure you are ready to begin? Your preview timer for question 1 will begin right away and you can not navigate back to this page once you start.",
            [
                {text: 'Yes', onPress: () => this.beginInterviewYes()},
                {text: 'No', onPress: ()=> console.log('No Pressed')}
            ],
            { cancelable: false }
        );

    }
    beginInterviewYes(){
        //this.activeId = this.selectedQuestion.id;
        let currentQuestion = this.state.currentQuestion;
        currentQuestion.started = true;
        this.setState({currentQuestion:currentQuestion,interviewState:'interview'});
        this.startPreviewTimer();
    }

    calculateScore(questionPair){
        let score = 0;

        if(!questionPair.scoringType || questionPair.scoringType == 1){
            //average scoring
            for(let ans of questionPair.answers){
                if(questionPair.transcript.toLowerCase().indexOf(ans.toLowerCase()) != -1){
                    score += 1;
                }
            }

            questionPair.score = (score / questionPair.answers.length) * 100;
        } else if(questionPair.scoringType == 2) {
            //One for all
            for(let ans of questionPair.answers){
                if(questionPair.transcript.toLowerCase().indexOf(ans.toLowerCase()) != -1){
                    score = 1;
                    break;
                }
            }
            questionPair.score = score * 100;

        } else {
            console.log("question Pair didn't have an expected scoring type. Running average.",questionPair);
            for(let ans of questionPair.answers){
                if(questionPair.transcript.toLowerCase().indexOf(ans.toLowerCase()) != -1){
                    score += 1;
                }
            }

            questionPair.score = (score / questionPair.answers.length) * 100;
        }

        questionPair.score = +questionPair.score.toFixed(2);
    }

    calculateOverallScore(){
        //calculate overallScore
        let overallScore = 0;
        let weightedScoring = true;

        for(let question of this.state.fireScreenResponse.questionPairs){
            if(!question.weight)
                weightedScoring = false;
        }

        if(weightedScoring){

            for(let question of this.state.fireScreenResponse.questionPairs){
                overallScore += question.score * question.weight;
            }

            overallScore = overallScore / 100;

            overallScore = +overallScore.toFixed(2);

        } else {
            for(let question of this.state.fireScreenResponse.questionPairs){
                overallScore += question.score;
            }
            overallScore = +(overallScore / this.state.fireScreenResponse.questionPairs.length).toFixed(2);
        }


        this.state.fireScreenResponse.score = overallScore;
        this.state.fireScreenResponse.status = "Completed";
        this.setState({fireScreenResponse:this.state.fireScreenResponse});
        console.log("Response after calc overall score: ",this.state.fireScreenResponse);
    }

    endInterview(){

        this.saveResponse(this.state.fireScreenResponse);
        this.sendSponsorEmail();


        Alert.alert(
            "Finished!",
            "You have completed this FireScreen, returning to access screen",
            [
                {text: 'Ok', onPress: () => this.props.navigation.navigate("Main")}
            ],
            { cancelable: false }
        );

        console.log("Submit interview",this.state.fireScreenResponse);
    }

    nextQuestion(){

        clearInterval(this.timerFD);
        clearInterval(this.transcriptFD);
        clearInterval(this.acceptFD);
        let currentQuestion = this.state.currentQuestion;
        currentQuestion.completed = true;
        currentQuestion.transcript = this.state.speechData;
        this.setState({speechData:""});
        currentQuestion.videoUrl = null;
        currentQuestion.audioUrl = null;
        this.setState({displayHelpTimers:false});
        if(!currentQuestion.answers){
            Alert.alert(
                "An error occured",
                "Current Question does not have an answer set. This is a developer warning.",
                [
                    {text: 'Ok', onPress: () => console.log("Ok pressed.")}
                ],
                { cancelable: false }
            );
            return;
        }

        this.calculateScore(currentQuestion);
        console.log("Current question after calculate Score: ",currentQuestion);

        //TODO during testing setting this.allowSave to false lets you rerun the same interview over and over.
        //TODO If you set to true to test the save functionality. Your place gets saved after each question/answer.
        //TODO So if you reload you'll be brought to the next question after the last one you completed.
        //TODO This section is where we need to get the actual video file and save to firebase storage.
        // The path to the video file location on the phone is in currentQuestion.data.uri.

        if(currentQuestion.data && this.allowSave){
            let filePath = currentQuestion.data.uri;
            let splitPath = filePath.split('/');
            //Need to test this actually is the filename (minus the path information).
            let fileName = splitPath[splitPath.length-1];

            //TODO get the file data from filePath specified on the android or ios device.
            let videoData;

            //path to save video in firebase reference.
            currentQuestion.videoUrl = this.state.fireScreen.id + "/" + this.state.fireScreenResponse.accessCode
                +"/"+fileName;


            this.setState({savingVideo:true});


            firebase.storage().ref(currentQuestion.videoUrl).put(videoData).then(snapshot=> {
                //TODO videoData in put() needs to be loaded first ^^^^^^ see previous TODO.
                console.log('Uploaded a video blob!');

                //just video continue to next question
                this.setState({savingVideo:false});
                delete this.state.fireScreenResponse.data;
                this.saveResponse(this.state.fireScreenResponse);
                this.nextQuestionSuccess();

            }, err => {

                this.setState({savingVideo:false});
                Alert.alert(
                    "An error occured",
                    "Error uploading video. Please click next again.",
                    [
                        {text: 'Ok', onPress: () => console.log("Ok pressed.")}
                    ],
                    { cancelable: false }
                );
                console.log("Video upload error: "+err);
            });

        }
        //TODO Remove this else before production.
        else {

            this.nextQuestionSuccess();
        }


    }

    nextQuestionSuccess(){
        let currentQuestion = this.state.currentQuestion;

        this.setState({transcriptEnabled:false,displayHelpTimers:true});
        if(currentQuestion.id == this.state.fireScreenResponse.questionPairs.length - 1){
            //At end
            currentQuestion = {question:"The End"};
            //this.activeId = -2;
            this.calculateOverallScore();
            this.setState({currentQuestion:currentQuestion,interviewState:'end'});
        }
        else{

            currentQuestion = this.state.fireScreenResponse.questionPairs[currentQuestion.id+1];
            currentQuestion.started = true;
            this.startPreviewTimer();
            this.setState({currentQuestion});
        }
    }

    startPreviewTimer(){
        console.log("Start preview timer.");
        clearInterval(this.timerFD);

        if(!this.state.allowPreview){

            setTimeout(()=>{
                this.autoStartRecording();
            },1200);
        }
        else if(this.previewTime === -1){
            console.log("unlimited preview.");
        }
        else {
            //console.log("Preview time: "+this.previewTime);
            this.futureDate = new Date();
            this.futureDate.setSeconds(this.futureDate.getSeconds()+this.previewTime);
            //console.log("Future Date: ",this.futureDate);
            let diffDate = new Date( this.futureDate.getTime() - new Date().getTime() );
            //console.log("Initial diffDate: ",diffDate);
            this.setState({diffDate});

            this.timerFD = setInterval(()=>{
                let diffDate;
                diffDate = new Date( this.futureDate.getTime() - new Date().getTime() );
                //console.log("In interval preview timer: ",diffDate);
                this.setState({diffDate});

                if(this.state.diffDate.getTime() <= 0){
                    clearInterval(this.timerFD);
                    this.autoStartRecording();
                    this.state.diffDate.setMinutes(0);
                    this.state.diffDate.setSeconds(0);
                }

            },1000);
        }
    }

    autoStartRecording(){
        this.setState({recording: true,speechData:""});

    }

    cameraReady(){
        if(this.camera && this.answerTime > 0){
            console.log("starting recording..")

            this.onStart();
            this.recordVideo();
        } else {
            console.log("autoStart record video no camera or bad answer time. Answer Time: "+this.answerTime+" Camera: ",this.camera);
        }
    }

    recordVideo = async function() {
        console.log("In record video.");
        if (this.camera && this.answerTime > 0) {
            //TODO this.answerTime is how long the camera countdown should be.
            //TODO we need this countdown timer to be displayed within the camera view.
            const options = { maxDuration:this.answerTime };
            const data = await this.camera.recordAsync(options);
            console.log(data);
            this.onStop(data);

        } else {
            console.log("record video no camera or bad answer time. Answer Time: "+this.answerTime+" Camera: ",this.camera);
        }
    };

    autoStopRecording(){
        this.setState({recording: false});
        if(this.camera){
            this.camera.stopRecording();
        }

        //this.broadcastService.broadcast({name: "stopVideo"});
    }

    onStart(){

        this.state.currentQuestion.attempt += 1;
        if(this.maxAttempts != -1 && this.state.currentQuestion.attempt > this.maxAttempts){
            alert("You have exceeded the max attempts. This shouldn't happen.");
        }

        console.log("Interview onStart: started");
        //this.alerts = new Array();
        if (this.state.currentQuestion.data)
            this.state.currentQuestion.data = null;

        this.setState({recording:true,currentQuestion:this.state.currentQuestion,speechData:""});
        if(this.timerFD)
            clearInterval(this.timerFD);
        if(this.acceptFD)
            clearInterval(this.acceptFD);

        this._startRecognizing();

    }

    onStop(recordedData){


        console.log("Interview onStop: ",recordedData);
        this.state.currentQuestion.data = recordedData;
        this.setState({recording:false,currentQuestion:this.state.currentQuestion});

        this._stopRecognizing();
        if(this.state.currentQuestion.attempt >= this.maxAttempts && this.maxAttempts != -1){

            this.setState({transcriptEnabled: true});
            Alert.alert(
                "No Remaining Attempts",
                "That was your last attempt. Please correct any changes needed to your transcript and click next.'",
                [
                    {text: 'OK', onPress: () => console.log('OK Pressed')},
                ],
                { cancelable: false }
            );
            this.startTranscriptTimer();
            console.log("Attempts maxed.");

        }


    }

    startAcceptCountdown(){
        clearInterval(this.timerFD);
        clearInterval(this.transcriptFD);
        clearInterval(this.acceptFD);
        this.acceptCountdown = 15;
        this.acceptFD = setInterval(()=>{

            if(this.acceptCountdown <= 0){
                this.setState({transcriptEnabled:true});
                clearInterval(this.acceptFD);
                this.startTranscriptTimer();
            }
            this.acceptCountdown -= 1;
            this.setState({acceptCountdown:this.acceptCountdown});

        },1000);
    }

    startTranscriptTimer(){
        clearInterval(this.timerFD);
        clearInterval(this.transcriptFD);
        clearInterval(this.acceptFD);
        this.transcriptCountdown = 60;
        this.transcriptFD = setInterval(()=>{

            if(this.transcriptCountdown <= 0){
                clearInterval(this.transcriptFD);
                this.setState({transcriptEnabled:false});
                this.nextQuestion();
                return;
            }
            this.transcriptCountdown -= 1;
            this.setState({transcriptCountdown:this.transcriptCountdown});

        },1000);
    }

    saveResponse(fireScreenResponse){

        console.log("saving fireScreenResponse ",fireScreenResponse);
        let path = "/fireScreenResponses/"+fireScreenResponse.accessCode;
        delete fireScreenResponse.$key;
        delete fireScreenResponse.$exists;
        if(this.allowSave){
            console.log("Saving.. ",fireScreenResponse);
            firebase.database().ref(path).set(fireScreenResponse);
        }



    }

    sendSponsorEmail(){
        let vm = this;
        //Todo We use the below snippet on the web app to send an email to the sponsor once the candidate has completed an interview.
        //Todo Please let me know if you have any ideas on how we can use emailjs in react-native.
        /*emailjs.send("firescreen_support", "interview_completed_sponsor",
            {"candidateName":this.state.fireScreenResponse.name,"sponsorEmail":this.state.fireScreen.sponsorEmail,
                "fireScreenName":this.state.fireScreen.title})
            .then(function(){
                console.log("Sponsor email sent successfully")
            }, function(err) {
                //alert("Send invite email failed, but candidate was created. To try again, click send email button in the candidate's row in the status table.");
                console.log("Error sending sponsor email",err);
            });*/
    }


    /* Speech to Text Handlers */
    onSpeechStart(e) {
        this.setState({
            started: '√',
        });
        console.log("Speech start: ",e);
    }

    onSpeechRecognized(e) {
        this.setState({
            recognized: '√',
        });
        console.log("Speech rec: ",e);
    }

    onSpeechEnd(e) {
        this.setState({
            end: '√',
        });
        console.log("Speech end: ",e);
    }

    onSpeechError(e) {
        this.setState({
            error: JSON.stringify(e.error),
        });
    }

    onSpeechResults(e) {
        let text = "";
        for(let item of e.value)
            text += item.toString()+" ";

        this.setState({
            results: e.value,
            speechData:text
        });

        console.log("results: ",e);
    }

    onSpeechPartialResults(e) {
        this.setState({
            partialResults: e.value,
        });
        console.log("partial results: ",e);
    }

    onSpeechVolumeChanged(e) {
        this.setState({
            pitch: e.value,
        });
    }

    async _startRecognizing(e) {
        this.setState({
            recognized: '',
            pitch: '',
            error: '',
            started: '',
            results: [],
            partialResults: [],
            end: ''
        });
        try {
            console.log("Starting voice");
            await Voice.start('en-US');
        } catch (e) {
            console.error(e);
        }
    }

    async _stopRecognizing(e) {
        console.log("Stopping voice.");
        try {
            await Voice.stop();
        } catch (e) {
            console.error(e);
        }
    }

    async _cancelRecognizing(e) {
        try {
            await Voice.cancel();
        } catch (e) {
            console.error(e);
        }
    }

    async _destroyRecognizer(e) {
        try {
            await Voice.destroy();
        } catch (e) {
            console.error(e);
        }
        this.setState({
            recognized: '',
            pitch: '',
            error: '',
            started: '',
            results: [],
            partialResults: [],
            end: ''
        });
    }


}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d9230f',

    },
    cameraContainer: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black'
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: 400
    },
    textInput: {
        height: 60,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginTop: 8,
        backgroundColor: 'white'
    },
    capture: {
        flex: 0,
        backgroundColor: '#d9230f',
        borderRadius: 5,
        padding: 15,
        paddingHorizontal: 20,
        alignSelf: 'center',
        margin: 20
    },
    button: {
        flex: 0,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 15,
        paddingHorizontal: 20,
        alignSelf: 'center',
        margin: 20
    },
    controlsContainer: {
        flex: 0,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    timerContainer: {
        flex: 0,
        flexDirection: 'column',
        justifyContent: 'center',
        height: 40,
        backgroundColor: '#d9230f'
    },
    text: {
        color:'white',
        marginBottom: 10
    }

});

async function requestAudioPermission(props) {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                'title': 'Firescreen Record Audio Permission',
                'message': 'Firescreen needs access to your microphone ' +
                'so your audio response can be saved.'
            }
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("You can use the microphone")
        } else {
            console.log("Microphone permission denied")
            props.navigation.navigate('Main');
        }
    } catch (err) {
        console.warn(err)
    }
}

const beginCard = '<div class="bf-card bf-invisible">\
    <div class="bf-card-title">\
    <h3>Welcome!</h3>\
</div>\
<div class="bf-card-content">\
    <p>Welcome to FireScreen, a Bondfire Product. FireScreen is a one of a kind automated interview screening.\
        It is designed to quickly expose the most qualified candidates based on our proprietary ranking algorithm.\
        Your answer to each question is converted from speech to text and fed into our ranking system.\
        The text is then compared against answers desired by the interview sponsor and a score is generated.\
        Candidates are then displayed to the sponsor by score, giving you maximum exposure for positions you are highly qualified for.\
    </p>\
    <br>\
        <h4 class="bf-red">How It Works</h4>\
        <ul class="bf-linespace-big">\
        <li>Please allow FireScreen access to your camera/microphone, if you have not done so already.</li>\
        <li>To begin each recording click the green \'Start Recording\' button.</li>\
        <li>If the sponsor has not allowed question previews, the recording will start immediately after you click \'Begin\' below.</li>\
        <li>To end each recording click the red \'Stop Recording\' button.</li>\
        <li>After each recording you have 15 seconds to decide if you want to re-record your answer or accept it. You can re-record\
        up to the max amount of attempts designated in the settings below.</li>\
        <li>Your speech to text conversion will be displayed below the video player once you accept your recording.\
        You have 1 minute to make any grammatical or spelling corrections you need at this moment.<br>\
        Note: Significant edits that change your intended answer can be viewed negatively when the sponsor\
        reviews your video submissions.</li>\
        <li>Once you are satisfied click next to move on to the next question.</li>\
        <li>Again, if the sponsor has not allowed question previews, the recording will begin once you click "Next Question".</li>\
        <li> Settings Explanation\
        <ul>\
        <li>Attempts per Question is how many times you can record a video answering each question.</li>\
        <li>Max Answer Length is how long in seconds your answer can be per question.</li>\
        <li>Question Preview Time is how long you can view the question before beginning your answer.\
        Once this alloted time has expired the recording will begin. If the sponsor has not allowed previews,\
        then each recording will begin immediately.</li>\
        <li>All settings are determined by the interview sponsor.</li>\
        </ul>\
        </li>\
        </ul>\
        <br>\
        <h4 class="text-primary">Please review the info and settings boxes below before beginning.</h4>\
        <h4 class="text-primary">Good Luck!</h4>\
    <br>\
    </div>\
    </div>';
//TODO added the below RN tag to render for begin state, but it looks terrible.
//TODO Any ideas on how we can display the above html in the begin state in a readable format?
/*<HTMLView
 value={beginCard}
 stylesheet={styles.htmlView}
 />*/