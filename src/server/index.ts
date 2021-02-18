import express from "express"
import { static as estatic } from "express"
import { join } from "path"

import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { packetHandler } from "./websocket/handler"
import { WebsocketServer } from "./websocket/server"

const webpackConfig = require('../../webpack.config');
const compiler = Webpack(webpackConfig)
const devMiddleware = WebpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath
})

var app = express()
var ws = new WebsocketServer(5354, packetHandler)
ws.start()

app.use("/static/script", estatic(join(__dirname, "../../public/dist")))
app.use("/static/style", estatic(join(__dirname, "../../public/css")))
app.use("/static/assets", estatic(join(__dirname, "../../public/assets")))
app.use("/static/script", estatic(join(__dirname, "../../public/dist")))

app.get("/", function (req, res, next) {
    res.sendFile(join(__dirname, "../../public/index.html"))
})

app.get("/favicon.ico", (req, res) => {
    res.sendFile(join(__dirname, "../../public/assets/favicon.ico"))
})

app.use("/js", devMiddleware)


app.use((req, res) => {
  res.status(404)
  res.send("Diese Seite existiert nicht!")
})

app.listen(5353, () => {
  console.log("\nStarted Server...\n");
});