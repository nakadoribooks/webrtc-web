class App{

    static get remoteStreamTemplate(){
        return '<div id="remote-${userId}" class="remoteBox">' + 
            '<video id="video-${userId}" src="${src}" oncanplay="this.play()"></video>' + 
            '<p>${userId}</p>'
            '</div>'
    }

    constructor(){
        this.userId = Math.random().toString(36).slice(-8)
        this.connectionList = []
        this.remoteStreamContainer = document.querySelector("#remoteStreamContainer")

        this.createRoomId()
        this.setupLocalStream()
        this.setupWamp()

        this.wamp.connect();
    }

    createRoomId(){
        let hash = location.hash
        if(hash != null && hash.length > 0){
            // 既存
            this.roomId = hash.slice( 1 ) ;
            return
        }

        this.roomId = Math.random().toString(36).slice(-8);
        location.href = location.origin + location.pathname + "#" + this.roomId
    }

    setupLocalStream(){
        let video = document.querySelector("#localVideo");
        video.oncanplay = ()=>{
            video.play()
        }
        Webrtc.setup((localStream)=>{
            video.src = window.URL.createObjectURL(localStream);
        })
    }

    setupWamp(){
        let wamp = new Wamp(this.roomId, this.userId, {
            onOpen: () => {
                console.log("onOpen")
                this.wamp.publishCallme()
            },
            onReceiveOffer: (targetId, sdp) =>{
                console.log("onReceiveOffer")
                let connection = this.createConnection(targetId)
                connection.receiveOffer(sdp)
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
                    let connection = connectionList[connectionIndex]
                    let targetId = connection.targetId;
                    let targetNode = document.querySelector("#remote-" + targetId)
                    targetNode.parentNode.removeChild(targetNode)
                    connection.close()
                    this.connectionList.splice(connectionIndex, 1)
                }
            }
        })

        this.wamp = wamp;
    }

    createConnection(targetId){
        let connection = new Connection(this.userId, targetId, this.wamp, {
            onAddedStream:()=>{
                console.log("---- onAddedStream ------")
                console.log(connection.remoteStream)

                let html = this.template(App.remoteStreamTemplate, {
                    src: window.URL.createObjectURL(connection.remoteStream),
                    userId: connection.targetId
                });

                let tmpDom = document.createElement('div');
                tmpDom.innerHTML = html
                let remoteDom = tmpDom.firstChild
                this.remoteStreamContainer.appendChild(remoteDom);
            }
        })
        this.connectionList.push(connection)
        return connection
    }

    findConnection(targetId){
        let connectionList = this.connectionList
        for(var i=0,max=connectionList.length;i<max;i++){
            let connection = connectionList[i]
            if (connection.targetId == targetId){
                return connection
            }
        }
        
        console.error("not found connection", targetId)
    }

    closeConnection(){
        this.wamp.publishClose()

        let connectionList = this.connectionList
        for(var i=0,max=connectionList.length;i<max;i++){
            let connection = connectionList[i]
            connection.close()
        }
        this.connectionList = []
    }

    template(string, values){
        return string.replace(/\$\{(.*?)\}/g, function(all, key){
            return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : "";
        });
    }
}

window.onload = function(){
    window.app = new App()
}

window.onbeforeunload = function(e) {    
    app.closeConnection()
};