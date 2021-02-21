// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: umbrella;
function createWidget(moduleName, moduleData, temperature_unit) {
  let widget = new ListWidget()


  const gradient = new LinearGradient();

  gradient.colors = [new Color("13262E"), new Color("203A43")];
  gradient.locations = [0.0, 1];

  widget.backgroundGradient = gradient;


  let title = widget.addText(moduleName.toUpperCase())
  title.font = Font.boldSystemFont(10)
  title.lineLimit = 2
  title.textColor = Color.white()

  widget.addSpacer(4)

  // Temperature

  let temperature = widget.addText(
    "" + moduleData.Temperature + temperature_unit
  )
  temperature.font = Font.boldRoundedSystemFont(26)
  temperature.textColor = Color.white()
  temperature.leftAlignText()

  widget.addSpacer(8)
  
  let dataRow = widget.addStack()
  dataRow.layoutVertically()
  
  // Humidity
  

  if ("Humidity" in moduleData) {
    humidityValue = moduleData.Humidity

    let humidityColor = Color.green();

    if (humidityValue <= 35) {
      humdityColor = Color.red()
    } else if (humidityValue <= 45) {
      humdityColor = Color.orange()
    }
        
    let humidityRow = dataRow.addStack()
    humidityRow.centerAlignContent()

    let humidityIconCol = humidityRow.addStack()
    humidityIconCol.layoutVertically()
    humidityIconCol.size = new Size(12, 12)
    humiditySF = SFSymbol.named("drop")	
    humiditySF.applyFont(Font.systemFont(9))
    humiditySF.applyMediumWeight()
    let humidityIcon = humidityIconCol.addImage(humiditySF.image);
    humidityIcon.resizeable = false
    humidityIcon.tintColor = humidityColor
    
    humidityRow.addSpacer(8)   

    let humidity = humidityRow.addText(humidityValue + " %")
    humidity.font = Font.mediumRoundedSystemFont(15)
    humidity.leftAlignText()
    humidity.textColor = humidityColor

    dataRow.addSpacer(4)
  }

  // CO2

  if ("CO2" in moduleData) {

    co2value = moduleData.CO2
    
    let co2Row = dataRow.addStack()
    co2Row.centerAlignContent()
       
    let co2Color = Color.green();
    let co2SF = SFSymbol.named("aqi.high")


    if (co2value >= 1500) {
      co2Color = Color.red()
      co2SF = SFSymbol.named("aqi.low")
    } else if (co2value >= 1000) {
      co2Color = Color.orange()
      co2SF = SFSymbol.named("aqi.medium")
    }
    
    let co2IconCol = co2Row.addStack()
    co2IconCol.layoutVertically()
    co2IconCol.size = new Size(12, 12)
    
    co2SF.applyFont(Font.systemFont(9))
    co2SF.applyMediumWeight()
    let co2Icon = co2IconCol.addImage(co2SF.image);
    co2Icon.resizable = false
    co2Icon.tintColor = co2Color
    
    co2Row.addSpacer(8)   

    let co2 = co2Row.addText(co2value + " ppm")
    co2.font = Font.mediumRoundedSystemFont(15)
    co2.leftAlignText()
    
    co2.textColor = co2Color
    
    dataRow.addSpacer(4)
  }
  
  dataRow.addSpacer(8)
  widget.addSpacer()

  // Timestamp

  const date = new Date(moduleData.time_utc * 1000)
  let dateFormatter = new DateFormatter()
  dateFormatter.useShortDateStyle()
  dateFormatter.useShortTimeStyle()
  let strDate = dateFormatter.string(date)

  let footer = widget.addText(strDate)		
  footer.font = Font.systemFont(10)
  footer.minimumScaleFactor = 0.5
  footer.lineLimit = 1
  footer.textColor = new Color("587782")
  footer.leftAlignText()

  return widget
}

async function authenticate(app_id, app_secret, username, password) {
  let req = new Request("https://api.netatmo.net/oauth2/token")

  req.method = "POST"

  req.addParameterToMultipart("grant_type", "password")
  req.addParameterToMultipart("client_id", app_id)
  req.addParameterToMultipart("client_secret", app_secret)
  req.addParameterToMultipart("username", username)
  req.addParameterToMultipart("password", password)
  req.addParameterToMultipart("scope", "read_station")

  let response = await req.loadJSON()
  return response.access_token
}

async function getData(token) {
  let req = new Request(
    "https://api.netatmo.net/api/getstationsdata?access_token=" +
      encodeURI(token)
  )

  let response = await req.loadJSON()
  return response.body
}

function getModuleData(moduleName, data) {
  const device = data.devices[0]

  if (device.module_name === moduleName) {
    return device.dashboard_data
  }

  const modules = device.modules.filter(
    (item) => item.module_name === moduleName
  )

  if (modules.length === 0) {
    return {}
  } else {
    return modules[0].dashboard_data
  }
}

let netatmoConfig = importModule("Netatmo.config")

let token = await authenticate(
  netatmoConfig.app_id,
  netatmoConfig.app_secret,
  netatmoConfig.username,
  netatmoConfig.password
)
let data = await getData(token)

temperature_unit = data.user.administrative.unit === 0 ? "°C" : "°F"

if (config.runsInApp) {
  // For in-app testing
  const module_name = "Innen"

  let widget = createWidget(
    module_name,
    getModuleData(module_name, data),
    temperature_unit
  )

  widget.presentSmall()
} else {
  let parameter = args.widgetParameter

  let widget = createWidget(
    parameter,
    getModuleData(parameter, data),
    temperature_unit
  )

  Script.setWidget(widget)
}