const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

Vue.component('cs50-app-component', {
    data() {
        return {
            comps: [
                { name: 'Votes', tag: 'votes-component' },
                { name: 'Flack', tag: 'flack-component' },
            ],
            activeComp: 'flack-component',
        };
    },
    methods: {
        changeComp(comp) {
            this.activeComp = comp.tag;
        },
    },
    template: `
    <div>
        <div class="row">
            <div class="col">
                <ul class="nav nav-pills">
                    <li class="nav-item" v-for="comp in comps" :key="comp.name">
                        <a class="nav-link" :class="{ active: comp.tag === activeComp }" @click.prevent="changeComp(comp)" href>
                            {{ comp.name }}
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <br />
        <div class="row">
            <div class="col">
                <component :is="activeComp""></component>
            </div>
        </div>
    </div>
    `,
});

Vue.component('bar-component', {
    props: ['max-width', 'height', 'val', 'max-val', 'color'],
    computed: {
        width() {
            if (this.maxVal === 0) {
                return 0;
            }
            return Math.round(this.val / this.maxVal * this.maxWidth);
        },
    },
    template: `
        <svg :width="maxWidth" :height="height">
            <rect class="vote-bar" x="0" y="0" :height="height" :width="width" :style="{ fill: color }">
            </rect>
        </svg>
    `,
});

Vue.component('votes-component', {
    data() {
        return {
            votes: {
                yes: 0,
                no: 0,
                maybe: 0,
            },
        };
    },
    created() {
        socket.on('vote totals', (data) => {
            this.votes = data;
        });
    },
    mounted() {
        socket.emit('init votes');
    },
    computed: {
        maxVal() {
            return Math.max(...Object.values(this.votes));
        },
    },
    methods: {
        addVote(key) {
            socket.emit('submit vote', { selection: key });
        },
    },
    template: `
        <div>
            <ul class="list-group">
                <li v-for="(v, k) in votes" :key="k" class="list-group-item">
                    <bar-component :max-width="300" :height="20" :val="v" :max-val="maxVal" color="steelblue"></bar-component>
                    {{ k }}: {{ v }}
                </li>
            </ul>
            <br />
            <div>Click to vote:</div>
            <div class="btn-group">
                </template>
                <template v-for="(v, k) in votes">
                    <btn-vote-component :key="k" :vote="k" @onvote="addVote">
                    </btn-vote-component>
                </template>
            </div>
        </div>
    `,
});

Vue.component('btn-vote-component', {
    props: ['vote'],
    methods: {
        sendVote() {
            this.$emit('onvote', this.vote);
        },
    },
    template: `
        <button class="btn btn-primary" @click="sendVote">
            {{ vote }}
        </button>
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
    <div>
        <div class="row">
            <div class="col">
                <p v-if="user">User: {{ user.name }}</p>
                <p v-if="activeChannel">Channel: {{ activeChannel }}</p>
                <user-component v-model="user"></user-component>
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
            activeChannel: '',
            newChannel: '',
        };
    },
    created() {
        socket.on('update channels', (data) => {
            this.channels = data;
        });
    },
    mounted() {
        socket.emit('get channels');
    },
    watch: {
        value(newVal) {
            this.activeChannel = newVal;
        },
        activeChannel(newVal) {
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
            <div>
                <ul>
                    <li v-for="message in messages" :key="message.id"><b>{{ message.user }}:</b> {{ message.msg }}</li>
                </ul>
            </div>
        </div>
    `,
});

const app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
    },
});
