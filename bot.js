const Discord = require("discord.js");
const client = new Discord.Client();
const request = require("request");
const configuracao = require("./config.json")
let ultima;
const options = {
    url: 'https://api.deezer.com/user/1186182186/history&access_token=' + configuracao.DeezerToken
};
//const embed = new Discord.RichEmbed()

client.on("ready", () => {
    console.log("Rodando");
    client.user.setActivity(ultima, {
        type: "LISTENING",
    });

});

setInterval(function (){ musica((musicaAtual) => {
    console.log(musicaAtual);
    //client.users.send("hello");
   const canal =  client.channels.cache.get(configuracao.CanalID);
    const Embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(musicaAtual.titulo)
        .setDescription(musicaAtual.artista)
        .setURL(musicaAtual.link)
        .setImage(musicaAtual.capa);

   canal.send(Embed);
    client.user.setActivity(musicaAtual.nomeartista,{type:"LISTENING"});
})},180000);

function musica (callback) {
    request(options,
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let musica = JSON.parse(body);
                ultima = musica["data"][0]["title"] + " - " + musica["data"][0]["artist"]["name"];
                let arrayRetorno = {};
                arrayRetorno.titulo = musica["data"][0]["title"];
                arrayRetorno.artista = musica["data"][0]["artist"]["name"];
                arrayRetorno.capa = musica["data"][0]["album"]["cover"];
                arrayRetorno.link = musica["data"][0]["link"];
                arrayRetorno.nomeartista = musica["data"][0]["title"] + " - " + musica["data"][0]["artist"]["name"];

                callback(arrayRetorno);
            } else {
                callback(null);
            }
        }
    );
}



client.login(configuracao.DiscordToken);