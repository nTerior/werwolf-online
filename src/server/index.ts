import express from "express"
import { static as estatic } from "express"
import { join } from "path"

import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"

const webpackConfig = require('../../webpack.config');
const compiler = Webpack(webpackConfig)
const devMiddleware = WebpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath
})

var app = express()
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
  res.send("This page does not exists!")
})

app.listen(8080, () => {
  console.log("Listening!");
});
