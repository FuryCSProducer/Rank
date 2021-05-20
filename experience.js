var jimp = global.nodemodule["jimp"];
var text2png = global.nodemodule['text2png'];
var fs = global.nodemodule["fs"];
var path = global.nodemodule["path"];
var request = global.nodemodule["request"];
var wait = global.nodemodule["wait-for-stuff"];
var { Canvas, Image } = global.nodemodule["canvas"];
var resize = global.nodemodule["resize-img"];
var streamBuffers = global.nodemodule["stream-buffers"];
var syncRequest = global.nodemodule["sync-request"];

// function httpsGet(url) {
	// var responsedata = "";
	// var res = wait.for.callback(https.get, url);
	// res.setEncoding("utf8");
	// res.on("data", function (chunk) {
		// responsedata += chunk;
	// });
	// wait.for.event(res, "end");
	// if (res.statusCode == 302 || res.statusCode == 301) {
		// return httpsGet(res.headers.location);
	// }
	// return Buffer.from(responsedata, "utf8");
// }
function sizeObject(object) {
  return Object.keys(object).length;
}

function ensureExists(path, mask) {
  if (typeof mask != 'number') {
    mask = 0o777;
  }
  try {
    fs.mkdirSync(path, {
      mode: mask,
      recursive: true
    });
    return undefined;
  } catch (ex) {
    return { err: ex };
  }
}
var rootpath = path.resolve(__dirname, "..", "eXPerience-files");
ensureExists(rootpath);
ensureExists(path.join(rootpath, "font"));
ensureExists(path.join(rootpath, "images"));
ensureExists(path.join(rootpath, "temp"));
// fs.existsSync(path.join(rootpath, "font", "font-1.ttf")) ? "" : fs.writeFileSync(path.join(rootpath, "font", "font-1.ttf"), global.fileMap["xp_font_1"]);
// fs.existsSync(path.join(rootpath, "font", "font-2.ttf")) ? "" : fs.writeFileSync(path.join(rootpath, "font", "font-2.ttf"), global.fileMap["xp_font_2"]);
var nameMapping = {
	"xp_font_1": path.join(rootpath, "font", "font-1.ttf"),
	"xp_font_2": path.join(rootpath, "font", "font-2.ttf"),
	"xp_global_rank": path.join(rootpath, "images", "global_rank.png"),
	"xp_group_rank": path.join(rootpath, "images", "group_rank.png"),
	"xp_blank_canvas": path.join(rootpath, "images", "blank.png"),
	"xp_gradient": path.join(rootpath, "images", "gradient.png"),
	"xp_level_bg": path.join(rootpath, "images", "level_bg.png"),
	"xp_progress_bar": path.join(rootpath, "images", "progress_bar.png"),
	"xp_card_bg": path.join(rootpath, "images", "card_bg.png"),
	"xp_achievement": path.join(rootpath, "images", "achievements.png"),
	"xp_level_n_bg": path.join(rootpath, "images", "level_n_bg.png")
}
for (var n in nameMapping) {
	if (!fs.existsSync(nameMapping[n])) {
		fs.writeFileSync(nameMapping[n], global.fileMap[n]);
	}
}

var fontpath = [
	path.join(rootpath, "font", "font-2.ttf"),
	path.join(rootpath, "font", "font-1.ttf")
];

var sizeObject = function(object) {
	return Object.keys(object).length;
};

if (!global.data.eXPerience) global.data.eXPerience = {};
if (!global.data.eXPerience.xp) global.data.eXPerience.xp = {};
if (!global.data.eXPerience.checkRankCooldown) global.data.eXPerience.checkRankCooldown = {};
if (!global.data.eXPerience.xpPerAction) global.data.eXPerience.xpPerAction = 1;
var checkxp = function (type, data) {
	if (sizeObject(data.mentions)) {
		var retval = "";
		for (var y in data.mentions) {
			if (!global.data.eXPerience.xp[y]) global.data.eXPerience.xp[y] = 0;
			switch (y.substr(0, 2)) {
				case "FB":
					retval == "" ? (retval = global.data.cacheName[y] + " - " + global.data.eXPerience.xp[y.substr(3)] + " XP") : (retval += "\r\n" + global.data.cacheName["FB-" + y.substr(3)] + " - " + global.data.eXPerience.xp[y.substr(3)] + " XP");
					break;
				case "DC": 
					break;
			}
		} 
		return {
			handler: "internal",
			data: retval
		}
	} else {
		if (!global.data.eXPerience.xp[data.msgdata.senderID]) global.data.eXPerience.xp[data.msgdata.senderID] = 0;
		//Calculate level on-the-fly
		var level = 1
		while (global.data.eXPerience.xp[data.msgdata.senderID] >= parseInt(level * 50 + level * 5)) {
			level++;
		}
		
		//Calculate global rank
		var sortable = [];
		for (var userID in global.data.eXPerience.xp) {
			sortable.push([userID, global.data.eXPerience.xp[userID]]);
		}
		sortable = sortable.sort(function(a, b) {
			return b[1] - a[1];
		});
		sortable = sortable.map(x => x = x[0]);
		var denied = {};
		if (typeof data.facebooks == "object" && sizeObject(data.facebooks)) {
			for (var n in data.facebooks) {
				try {
					if (typeof data.facebooks[n].api == "object" && typeof data.facebooks[n].api.getCurrentUserID == "function") {
						denied[data.facebooks[n].api.getCurrentUserID()] = true;
					}
				} catch (ex) {}
			}
		} else {
			denied[data.facebookapi.getCurrentUserID()] = true;
		}
		sortable.filter(function (x) {
			return !denied[x];
		});
		var globalrank = sortable.indexOf(data.msgdata.senderID) + 1;
		
		return {
			handler: "internal",
			data: global.data.eXPerience.xp[data.msgdata.senderID] + " XP (Level " + level + ")" + "\r\n" + "Global rank: #" + globalrank
		}
	}
}

var chathook = function (type, data) {
	if (!global.data.eXPerience.xp[(data.msgdata.senderID || data.msgdata.author)]) global.data.eXPerience.xp[(data.msgdata.senderID || data.msgdata.author)] = 0;
	global.data.eXPerience.xp[(data.msgdata.senderID || data.msgdata.author)] += global.data.eXPerience.xpPerAction;
}

var xprank = function (type, data) {
	var curr = Date.now();
	if (!global.data.eXPerience.xp[data.msgdata.senderID]) global.data.eXPerience.xp[data.msgdata.senderID] = 0;
	if (!global.data.eXPerience.checkRankCooldown[data.msgdata.senderID]) global.data.eXPerience.checkRankCooldown[data.msgdata.senderID] = 0;
	try {
		if (global.data.eXPerience.checkRankCooldown[data.msgdata.senderID] + 3000 < curr) {
			global.data.eXPerience.checkRankCooldown[data.msgdata.senderID] = curr;
			//Calculate level on-the-fly
			var level = 1
			while (global.data.eXPerience.xp[data.msgdata.senderID] >= parseInt(level * 50 + level * 5)) {
				level++;
			}
			
			//Calculate global rank
			var sortable = [];
			for (var userID in global.data.eXPerience.xp) {
				sortable.push([userID, global.data.eXPerience.xp[userID]]);
			}
			sortable = sortable.sort(function(a, b) {
				return b[1] - a[1];
			});
			sortable = sortable.map(x => x = x[0]);
			var denied = {};
			if (typeof data.facebooks == "object" && sizeObject(data.facebooks)) {
				for (var n in data.facebooks) {
					try {
						if (typeof data.facebooks[n].api == "object" && typeof data.facebooks[n].api.getCurrentUserID == "function") {
							denied[data.facebooks[n].api.getCurrentUserID()] = true;
						}
					} catch (ex) {}
				}
			} else {
				denied[data.facebookapi.getCurrentUserID()] = true;
			}
			sortable.filter(function (x) {
				return !denied[x];
			});
			var globalrank = sortable.indexOf(data.msgdata.senderID) + 1;
			
			//Calculate group rank
			if (data.msgdata.isGroup) {
				var groupdata = wait.for.callback(data.facebookapi.getThreadInfo, data.msgdata.threadID);
				var pID = groupdata.participantIDs;
				var sortablex = [];
				for (var n in pID) {
					sortablex.push([pID[n], global.data.eXPerience.xp[pID[n]]]);
				}
				sortablex = sortablex.sort(function(a, b) {
					return b[1] - a[1];
				});
				sortablex = sortablex.map(x => x = x[0]);
				sortablex = sortablex.filter(function (x) {
					return !denied[x];
				});
				var grouprank = sortablex.indexOf(data.msgdata.senderID) + 1;
			} else {
				var grouprank = "N/A"
			}
			
			//User info
			//var userinfo = wait.for.callback(data.facebookapi.getUserInfo, data.msgdata.senderID);
			var name = global.data.cacheName["FB-" + data.msgdata.senderID];
			request({
				url: "https://graph.facebook.com/" + data.msgdata.senderID + "/picture?width=180&height=180&access_token=170440784240186|bc82258eaaf93ee5b9f577a8d401bfc9",
				encoding: null
			}, function (error, response, body) {
				if (error) data.log(error);
				if (!error && response.statusCode == 200) { 
					var avatar = body;
					data.log("Got avatar data for", data.msgdata.senderID);
				} else {
					data.log("Failed to get avatar data for", data.msgdata.senderID, ". Retrying...");
					return xprank(type, data);
				}
				fs.writeFileSync(path.join(rootpath, "temp", data.msgdata.senderID + "_avatar.png"), avatar);
				//Throwing invalid character in name (crash!)
				name = name.replace(/[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g, "");
				if (name == "") {
					name = "_";
				}
				//Image generating
				var r = (global.data.eXPerience.xp[data.msgdata.senderID] - ((level - 1) * 50 + (level - 1) * 5)) * 381 / (50 + level * 5);
				
				var imagelist = {};
				imagelist.avatar = path.join(rootpath, "temp", data.msgdata.senderID + "_avatar.png");
				
				fs.writeFileSync(path.join(rootpath, "temp", data.msgdata.senderID + "_glrn.png"), text2png("#" + globalrank, {
					color: "#bfd4ed",
					font: "15.83px UTM_Swi",
					localFontPath: fontpath[0],
					localFontName: "UTM_Swi"
				}));
				imagelist.global_ranking_number = path.join(rootpath, "temp", data.msgdata.senderID + "_glrn.png");
				
				fs.writeFileSync(path.join(rootpath, "temp", data.msgdata.senderID + "_grrn.png"), text2png("#" + grouprank, {
					color: "#5f66ee",
					font: "25px UTM_Swi",
					localFontPath: fontpath[0],
					localFontName: "UTM_Swi"
				}));
				imagelist.group_ranking_number = path.join(rootpath, "temp", data.msgdata.senderID + "_grrn.png");
				
				fs.writeFileSync(path.join(rootpath, "temp", data.msgdata.senderID + "_level.png"), text2png(
					(level < 10) ? " " + level : level.toString(), {
						color: "#ffffff",
						font: "30px UTM_Swi",
						localFontPath: fontpath[0],
						localFontName: "UTM_Swi"
					}
				));
				imagelist.level = path.join(rootpath, "temp", data.msgdata.senderID + "_level.png");
				
				fs.writeFileSync(path.join(rootpath, "temp", data.msgdata.senderID + "_xp.png"), text2png(
					global.data.eXPerience.xp[data.msgdata.senderID].toString() + " / " + parseInt(level * 50 + level * 5).toFixed(0) + " XP", {
						color: "#ffffff",
						font: "16.5px UTM_Swi",
						localFontPath: fontpath[0],
						localFontName: "UTM_Swi"
					}
				));
				imagelist.xp = path.join(rootpath, "temp", data.msgdata.senderID + "_xp.png");
				
				fs.writeFileSync(path.join(rootpath, "temp", data.msgdata.senderID + "_name.png"), text2png(name, {
					color: '#bfd4ed',
					font: '40px UTM_NH',
					localFontPath: fontpath[1],
					localFontName: 'UTM_NH'
				}));
				imagelist.name = path.join(rootpath, "temp", data.msgdata.senderID + "_name.png");
				
				data.log("Generated some required PNG for", data.msgdata.senderID);
				imagelist.global_rank_text = nameMapping["xp_global_rank"]
				imagelist.group_rank_text = nameMapping["xp_group_rank"]
				imagelist.layer1 = nameMapping["xp_blank_canvas"]
				imagelist.gradient_bg = nameMapping["xp_gradient"]
				imagelist.level_bg = nameMapping["xp_level_bg"]
				imagelist.progress_bar = nameMapping["xp_progress_bar"]
				imagelist.card_bg = nameMapping["xp_card_bg"]
				imagelist.achievement = nameMapping["xp_achievement"]
				imagelist.level_n_bg = nameMapping["xp_level_n_bg"]
				
				var maplist = [];
				var promiselist = [];
				for (var n in imagelist) {
					maplist.push(n);
					(function (nx) {
						if (nx !== false) {
							var pm = jimp.read(imagelist[n]).catch(function (err) {
								throw `Error at ${nx}: ${err}`;
							});
						} else {
							var pm = new Promise(function (resolve, reject) {
								new Jimp(256, 256, function (err, image) {
									if (err) return reject(err);
									resolve(image);
								});
							});
						}
						promiselist.push(pm);
						//data.log("Created Promise", n, "for", data.msgdata.senderID);
					})(JSON.parse(JSON.stringify(n)));
				}
				//data.log("Promise list for", data.msgdata.senderID, ":", promiselist);
				Promise.all(promiselist).then(function (datar) {
					data.log("Resolved Promise for", data.msgdata.senderID);
					var imagelistx = {};
					for (var n in datar) {
						imagelistx[maplist[n]] = datar[n];
					}
					data.log("Generated JIMP object from file for", data.msgdata.senderID);
					imagelistx.layer1.composite(imagelistx.gradient_bg,0,0)
					try {	
						imagelistx.layer1.composite(imagelistx.avatar.resize(180,jimp.AUTO),50,50);
					} catch (ex) {}
					imagelistx.layer1.composite(imagelistx.name,285,100)
						.composite(imagelistx.level,285,190)
						.composite(imagelistx.xp,520,195)
						.composite(imagelistx.global_ranking_number,800,195);
					imagelistx.layer1.rgba(true);
					data.log("Composited image for", data.msgdata.senderID);
					imagelistx.layer1.getBufferAsync(jimp.MIME_PNG).then((resultimagebuffer) => {
						var imagesx = new streamBuffers.ReadableStreamBuffer({
							frequency: 1,
							chunkSize: 8192
						});
						imagesx.path = "image.png";
						imagesx.put(resultimagebuffer);
						data.log("Got image stream for", data.msgdata.senderID);
						imagesx.stop();
						// var filenamex = path.join(rootpath, "temp-" + data.msgdata.senderID + "." + imagelistx.layer1.getExtension());
						// wait.for.callback(imagelistx.layer1.write, filenamex);
						// return {
							// handler: "internal-raw",
							// data: {
								// attachment: [fs.createReadStream(filenamex)]
							// }
						// }
						
						data.return({
							handler: "internal-raw", 
							data: {
								attachment: [imagesx]
							}
						});
					});
				}).catch(function (ex) {
					data.return({
						handler: "internal", 
						data: ex
					});
				});
			});
		} else {
			return {
				handler: "internal",
				data: "❎ Thao tác quá nhanh, hãy thử lại sau " + ((global.data.eXPerience.checkRankCooldown[data.msgdata.senderID] + 3 - curr) / 1000).ceil(0) + " giây nữa."
			}
		}
	} catch (ex) {
		data.log("WARNING: Code crashed.", ex);
		global.data.eXPerience.checkRankCooldown[data.msgdata.senderID] = 0;
		return xprank(type, data);
	}
}

module.exports = {
	checkxp,
	chathook,
	xprank
}