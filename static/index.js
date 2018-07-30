const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

Vue.component('cs50-app-component', {
    template: `
        <flack-component></flack-component>
    `,
});

Vue.component('flack-component', {
    data() {
        return {
            user: null,
            activeChannel: null,
        };
    },
    template: `
    <div class="h-100">
        <div class="row mb-5">
            <div class="col">
                <span v-if="user">User: {{ user.name }},</span>
                <span v-if="activeChannel">Channel: {{ activeChannel }}</span>
            </div>
        </div>
        <div class="row">
            <div class="col-3">
                <channels-list-component v-model="activeChannel"></channels-list-component>
            </div>
            <div class="col">
                <div v-if="user && activeChannel">
                    <chat-component :user="user" :channel="activeChannel"></chat-component>
                </div>
                <div v-else>
                    Please login and choose a channel to chat.
                    <user-component v-model="user"></user-component>
                </div>
            </div>
        </div>
    </div>`,
});

Vue.component('user-component', {
    props: ['value'],
    data() {
        return {
            user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
            userinput: '',
        };
    },
    created() {
        if (this.user) {
            this.$emit('input', this.user);
        }
    },
    watch: {
        user(newVal) {
            if (newVal) {
                localStorage.setItem('user', JSON.stringify(newVal));
            } else {
                localStorage.removeItem('user');
            }
            this.$emit('input', newVal);
        },
    },
    methods: {
        setUser() {
            this.user = { name: this.userinput };
        },
        clearUser() {
            this.user = null;
        },
    },
    template: `
        <div>
        <template v-if="user">
            <button class="btn btn-link" @click="clearUser">Clear user</button>
        </template>
        <template v-else>
            <form class="form-inline" @submit.prevent="setUser">
                
                <label class="sr-only" for="inlineFormInputGroupUsername2">Username</label>
                <div class="input-group mb-2 mr-sm-2">
                <div class="input-group-prepend">
                    <div class="input-group-text">User</div>
                </div>
                <input v-model="userinput" type="text" class="form-control" id="inlineFormInputGroupUsername2" placeholder="Choose user name">
                </div>
            
                <button type="submit" class="btn btn-primary mb-2">Submit</button>
            </form>
        </template>
        </div>
    `,
});

Vue.component('channels-list-component', {
    props: ['value'],
    data() {
        return {
            channels: [],
            activeChannel: localStorage.getItem('channel') ? localStorage.getItem('channel') : null,
            newChannel: '',
        };
    },
    created() {
        socket.on('update channels', (data) => {
            this.channels = data;
        });
        this.$emit('input', this.activeChannel);
    },
    mounted() {
        socket.emit('get channels');
    },
    watch: {
        value(newVal) {
            this.activeChannel = newVal;
        },
        activeChannel(newVal) {
            localStorage.setItem('channel', newVal);
            this.$emit('input', newVal);
        },
    },
    methods: {
        selectChannel(channel) {
            this.activeChannel = channel;
        },
        addChannel(channel) {
            socket.emit('add channel', { channel });
        },
        deleteChannel(channel) {
            socket.emit('delete channel', { channel });
        },
    },
    template: `
        <div>
            <div class="list-group">
                <a
                    class="list-group-item list-group-item-action"
                    v-for="channel in channels"
                    :key="channel"
                    :class="{ active: channel == activeChannel }"
                    href
                    @click.prevent="selectChannel(channel)"
                >
                    <div class="d-flex justify-content-between">
                        <div>{{ channel }}</div>
                        <button v-if="channel != activeChannel" type="button" class="close" style="font-size: 1.2rem;" @click.stop.prevent="deleteChannel(channel)">
                            <span>&times;</span>
                        </button>
                    </div>
                </a>
            </div>
            <form @submit.prevent="addChannel(newChannel)">
                <div class="input-group mt-3">
                    <input type="text" v-model="newChannel" class="form-control form-control-sm" placeholder="Add channel" required>
                    <div class="input-group-append">
                        <input class="btn btn-primary btn-sm" type="submit" value="Add">
                    </div>
                </div>
            </form>
        </div>
    `,
});

Vue.component('chat-component', {
    props: ['user', 'channel'],
    data() {
        return {
            messages: [],
            newMessage: '',
        };
    },
    created() {
        socket.on('update all messages', (data) => {
            this.messages = data;
        });
    },
    mounted() {
        socket.emit('get all messages', { channel: this.channel });
        socket.on('new message', (data) => {
            this.messages.push(data);
        });
    },
    watch: {
        channel(newVal, oldVal) {
            this.messages = [];
            socket.emit('leave channel', { channel: oldVal });
            socket.emit('get all messages', { channel: newVal });
        },
    },
    methods: {
        sendMessage(message) {
            socket.emit('send message', {
                user: this.user,
                channel: this.channel,
                message,
            });
            this.newMessage = '';
        },
    },
    template: `
        <div>
            <h3>{{ channel }}</h3>
            <div class="chat-messages">
                <ul>
                    <li v-if="messages.length == 0">No message yet</li>
                    <li v-else v-for="message in messages" :key="message.id"><b>{{ message.user }}:</b> {{ message.msg }}</li>
                </ul>
            </div>
            <form @submit.prevent="sendMessage(newMessage)">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="basic-addon">{{ user.name }} &gt;</span>
                    </div>
                    <input type="text" v-model="newMessage" class="form-control" placeholder="Type your message">
                    <div class="input-group-append">
                        <input type="submit" class="btn btn-primary" value="Send">
                    </div>
                </div>
            </form>
        </div>
    `,
});

const app = new Vue({
    el: '#app',
});
