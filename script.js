// ▼ component ---------

let MyStream = {
    props: ['src', 'userId'],
    template: `<div class="column is-2 box videoBox myBox">
                    <p>You ({{userId}})</p>
                    <video class="video" v-bind:src="src" />
                </div>`,

    mounted: function(){
        let video = this.$el.querySelector("video")
        video.oncanplay = ()=>{
            video.play()
        }
    }
}

let RemoteStream = {
    props: ['src', 'userId'],
    template:  `<div class="column box videoBox remoteBox">
                    <p>{{userId}}</p>
                    <video class="video" v-bind:src="src" />
                 </div> `,
    mounted: function(){
        let video = this.$el.querySelector("video")
        video.oncanplay = ()=>{
            video.play()
        }
    }
}

// ▼ Main ---------

let app = new Vue({
    el: '#app',
    template: `<div class="columns" id="videoList">
                <my-stream 
                    v-bind:src="myStream.src" v-bind:userId="userId"
                />
                <div class="column is-10 columns">
                    <remote-stream v-for="stream in remoteStreamList" 
                        v-bind:src="stream.src" v-bind:userId="stream.targetId"
                    />
                </div>
        </div>`, 
    components: {
        'remote-stream': RemoteStream
        , 'my-stream': MyStream
    },

    data:{
        userId: Math.random().toString(36).slice(-8)
        , myStream : {"src": ""}
        , remoteStreamList: []
    },

    created: function(){
        this.connectionList = []

        // ▼ firebase
        let config = {
            apiKey: "AIzaSyBddi0IhET7FoWts42BPWQFWsq38N17hPA",
            authDomain: "nakadoriwebrtc.firebaseapp.com",
            databaseURL: "https://nakadoriwebrtc.firebaseio.com",
            projectId: "nakadoriwebrtc",
            storageBucket: "nakadoriwebrtc.appspot.com",
            messagingSenderId: "668320959045"
        };
        firebase.initializeApp(config);

        let ref = firebase.database().ref('rooms')

        let hash = location.hash
        if(hash != null && hash.length > 0){
            // 既存
            let roomId = hash.slice( 1 ) ;
            this.roomRef = ref.child(roomId)
            return
        }

        // 新規
        this.roomRef = ref.push()
        this.roomRef.set({})

        location.href = location.origin + location.pathname + "#" + this.roomRef.key
    },

    mounted: function(){

        this.setupWamp()
        this.setupStream()

        Wamp.connect()
    },

    methods: {

        setupStream: function(){
            Webrtc.setup().then((stream) => {
                this.myStream.src = window.URL.createObjectURL(stream);
            })
        },

        setupWamp:function(){
            Wamp.setup(this.roomRef.key, this.userId, {
                onOpen: () => {
                    console.log("onOpen")
                    let topic = Wamp.endpointCallme()
                    Wamp.session.publish(topic, [this.userId]);
                },
                onReceiveOffer: (targetId, sdp) =>{
                    console.log("onReceiveOffer")
                    let connection = this.createConnection(targetId)
                    connection.publishAnswer(sdp)
                },
                onReceiveCandidate: (targetId, candidate) => {
                    let connection = this.findConnection(targetId);
                    connection.receiveCandidate(candidate);
                },
                onReceiveAnswer: (targetId, sdp) => {
                    console.log("onReceiveAnswer")
                    let connection = this.findConnection(targetId)
                    connection.receiveAnswer(sdp)
                },
                onReceiveCallme:(targetId)=>{
                    console.log("onReceivCallme")
                    let connection = this.createConnection(targetId)
                    connection.publishOffer()
                },
                onCloseConnection:(targetId) => {
                    console.log("onCloseConnection", targetId)

                    // removeConnection
                    let connectionList = this.connectionList
                    let connectionIndex = connectionList.findIndex((element, index, array)=>{
                        return element.targetId == targetId
                    })
                    if(connectionIndex != null){
                        connectionList[connectionIndex].close()
                        this.connectionList.splice(connectionIndex, 1)
                    }

                    // removeStream
                    let remoteStreamList = this.remoteStreamList
                    let streamIndex = remoteStreamList.findIndex((element, index, array)=>{
                        return element.targetId == targetId
                    })
                    if(streamIndex != null){
                        this.remoteStreamList.splice(streamIndex, 1)
                    }
                }
            })
        },

        createConnection: function(targetId){
            let connection = new Connection(this.userId, targetId, {
                onAddedStream:(stream)=>{
                    stream.src = window.URL.createObjectURL(stream);
                    this.remoteStreamList.push(stream)
                }
            })
            this.connectionList.push(connection)
            return connection
        },

        findConnection: function(targetId){
            let connectionList = this.connectionList
            for(var i=0,max=connectionList.length;i<max;i++){
                let connection = connectionList[i]
                if (connection.targetId == targetId){
                    return connection
                }
            }
            
            console.error("not found connection", targetId)
        },

        closeConnection: function(){
            let topic = Wamp.endpointClose()
            Wamp.session.publish(topic, [this.userId]);

            let connectionList = this.connectionList
            for(var i=0,max=connectionList.length;i<max;i++){
                let connection = connectionList[i]
                connection.close()
            }
            this.connectionList = []
        },
    }
})

window.onbeforeunload = function(e) {    
    app.closeConnection()
};