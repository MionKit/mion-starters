/* Auto-generated AOT pure functions cache - do not edit */
export const pureFnsCache = {"mionFormats":{"isDateString":{namespace:"mionFormats",paramNames:[],code:"return function is_date_string(year, month, day) {\n    let y = void 0;\n    if (year) {\n      if (year.length !== 4) return false;\n      y = Number(year);\n      if (isNaN(y)) return false;\n      if (y < 0 || y > 9999) return false;\n    }\n    if (month.length !== 2) return false;\n    const m = Number(month);\n    if (isNaN(m)) return false;\n    if (m < 1 || m > 12) return false;\n    if (day) {\n      if (day.length !== 2) return false;\n      const d = Number(day);\n      if (isNaN(d)) return false;\n      if (d < 1 || d > 31) return false;\n      if (m === 2) {\n        if (d > 29) return false;\n        if (y && d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) return false;\n      } else if ((m === 4 || m === 6 || m === 9 || m === 11) && d > 30) {\n        return false;\n      }\n    }\n    return true;\n  };",fnName:"isDateString",bodyHash:"1_oB_gADdf9PX4",pureFnDependencies:[],createPureFn:function get_isDateString(){return function is_date_string(year, month, day) {
    let y = void 0;
    if (year) {
      if (year.length !== 4) return false;
      y = Number(year);
      if (isNaN(y)) return false;
      if (y < 0 || y > 9999) return false;
    }
    if (month.length !== 2) return false;
    const m = Number(month);
    if (isNaN(m)) return false;
    if (m < 1 || m > 12) return false;
    if (day) {
      if (day.length !== 2) return false;
      const d = Number(day);
      if (isNaN(d)) return false;
      if (d < 1 || d > 31) return false;
      if (m === 2) {
        if (d > 29) return false;
        if (y && d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) return false;
      } else if ((m === 4 || m === 6 || m === 9 || m === 11) && d > 30) {
        return false;
      }
    }
    return true;
  };},fn:undefined},"isDateString_YMD":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isDate = jUtil.getPureFn(\"mionFormats\", \"isDateString\");\n  return function is_date(value) {\n    const parts = value.split(\"-\");\n    return parts.length === 3 && isDate(parts[0], parts[1], parts[2]);\n  };",fnName:"isDateString_YMD",bodyHash:"TgdYN25ps-eNtS",pureFnDependencies:["isDateString"],createPureFn:function get_isDateString_YMD(jUtil){const isDate = jUtil.getPureFn("mionFormats", "isDateString");
  return function is_date(value) {
    const parts = value.split("-");
    return parts.length === 3 && isDate(parts[0], parts[1], parts[2]);
  };},fn:undefined},"isDateString_DMY":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isDate = jUtil.getPureFn(\"mionFormats\", \"isDateString\");\n  return function is_date(value) {\n    const parts = value.split(\"-\");\n    return parts.length === 3 && isDate(parts[2], parts[1], parts[0]);\n  };",fnName:"isDateString_DMY",bodyHash:"aVDMyOqrsrbcbW",pureFnDependencies:["isDateString"],createPureFn:function get_isDateString_DMY(jUtil){const isDate = jUtil.getPureFn("mionFormats", "isDateString");
  return function is_date(value) {
    const parts = value.split("-");
    return parts.length === 3 && isDate(parts[2], parts[1], parts[0]);
  };},fn:undefined},"isDateString_MDY":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isDate = jUtil.getPureFn(\"mionFormats\", \"isDateString\");\n  return function is_date(value) {\n    const parts = value.split(\"-\");\n    return parts.length === 3 && isDate(parts[2], parts[0], parts[1]);\n  };",fnName:"isDateString_MDY",bodyHash:"iM5EqlmgeDmVjF",pureFnDependencies:["isDateString"],createPureFn:function get_isDateString_MDY(jUtil){const isDate = jUtil.getPureFn("mionFormats", "isDateString");
  return function is_date(value) {
    const parts = value.split("-");
    return parts.length === 3 && isDate(parts[2], parts[0], parts[1]);
  };},fn:undefined},"isDateString_YM":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isDate = jUtil.getPureFn(\"mionFormats\", \"isDateString\");\n  return function is_date(value) {\n    const parts = value.split(\"-\");\n    return parts.length === 2 && isDate(parts[0], parts[1]);\n  };",fnName:"isDateString_YM",bodyHash:"aYQTJv_F4JU3nI",pureFnDependencies:["isDateString"],createPureFn:function get_isDateString_YM(jUtil){const isDate = jUtil.getPureFn("mionFormats", "isDateString");
  return function is_date(value) {
    const parts = value.split("-");
    return parts.length === 2 && isDate(parts[0], parts[1]);
  };},fn:undefined},"isDateString_MD":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isDate = jUtil.getPureFn(\"mionFormats\", \"isDateString\");\n  return function is_date(value) {\n    const parts = value.split(\"-\");\n    return parts.length === 2 && isDate(void 0, parts[0], parts[1]);\n  };",fnName:"isDateString_MD",bodyHash:"NVGldNTml6x6cv",pureFnDependencies:["isDateString"],createPureFn:function get_isDateString_MD(jUtil){const isDate = jUtil.getPureFn("mionFormats", "isDateString");
  return function is_date(value) {
    const parts = value.split("-");
    return parts.length === 2 && isDate(void 0, parts[0], parts[1]);
  };},fn:undefined},"isDateString_DM":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isDate = jUtil.getPureFn(\"mionFormats\", \"isDateString\");\n  return function is_date(value) {\n    const parts = value.split(\"-\");\n    return parts.length === 2 && isDate(void 0, parts[1], parts[0]);\n  };",fnName:"isDateString_DM",bodyHash:"ItACHY5Jvp_3sG",pureFnDependencies:["isDateString"],createPureFn:function get_isDateString_DM(jUtil){const isDate = jUtil.getPureFn("mionFormats", "isDateString");
  return function is_date(value) {
    const parts = value.split("-");
    return parts.length === 2 && isDate(void 0, parts[1], parts[0]);
  };},fn:undefined},"isTimeZone":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isH = jUtil.getPureFn(\"mionFormats\", \"isHours\");\n  const isM = jUtil.getPureFn(\"mionFormats\", \"isMinutes\");\n  return function is_tz(timeZone) {\n    const isZ = timeZone === \"Z\" || timeZone === \"z\";\n    if (isZ) return true;\n    const tzParts = timeZone.split(\":\");\n    if (tzParts.length !== 2) return false;\n    const hours = tzParts[0];\n    const minutes = tzParts[1];\n    return isH(hours) && isM(minutes);\n  };",fnName:"isTimeZone",bodyHash:"0Zcw0D7iktjrgz",pureFnDependencies:["isHours","isMinutes"],createPureFn:function get_isTimeZone(jUtil){const isH = jUtil.getPureFn("mionFormats", "isHours");
  const isM = jUtil.getPureFn("mionFormats", "isMinutes");
  return function is_tz(timeZone) {
    const isZ = timeZone === "Z" || timeZone === "z";
    if (isZ) return true;
    const tzParts = timeZone.split(":");
    if (tzParts.length !== 2) return false;
    const hours = tzParts[0];
    const minutes = tzParts[1];
    return isH(hours) && isM(minutes);
  };},fn:undefined},"isHours":{namespace:"mionFormats",paramNames:[],code:"return function is_h(hours) {\n    if (!hours.length || hours.length > 2) return false;\n    const numberHours = Number(hours);\n    if (isNaN(numberHours)) return false;\n    return numberHours >= 0 && numberHours <= 23;\n  };",fnName:"isHours",bodyHash:"wsGHZIT8eblMfW",pureFnDependencies:[],createPureFn:function get_isHours(){return function is_h(hours) {
    if (!hours.length || hours.length > 2) return false;
    const numberHours = Number(hours);
    if (isNaN(numberHours)) return false;
    return numberHours >= 0 && numberHours <= 23;
  };},fn:undefined},"isMinutes":{namespace:"mionFormats",paramNames:[],code:"return function is_m(mins) {\n    if (!mins.length || mins.length > 2) return false;\n    const numberMinutes = Number(mins);\n    if (isNaN(numberMinutes)) return false;\n    return numberMinutes >= 0 && numberMinutes <= 59;\n  };",fnName:"isMinutes",bodyHash:"KEMDuHWSc4_Cv1",pureFnDependencies:[],createPureFn:function get_isMinutes(){return function is_m(mins) {
    if (!mins.length || mins.length > 2) return false;
    const numberMinutes = Number(mins);
    if (isNaN(numberMinutes)) return false;
    return numberMinutes >= 0 && numberMinutes <= 59;
  };},fn:undefined},"isSeconds":{namespace:"mionFormats",paramNames:[],code:"return function is_s(secs) {\n    if (!secs.length || secs.length > 2) return false;\n    const numberSeconds = Number(secs);\n    if (isNaN(numberSeconds)) return false;\n    return numberSeconds >= 0 && numberSeconds <= 59;\n  };",fnName:"isSeconds",bodyHash:"nq28WUDHB__8hY",pureFnDependencies:[],createPureFn:function get_isSeconds(){return function is_s(secs) {
    if (!secs.length || secs.length > 2) return false;
    const numberSeconds = Number(secs);
    if (isNaN(numberSeconds)) return false;
    return numberSeconds >= 0 && numberSeconds <= 59;
  };},fn:undefined},"isSecondsWithMs":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isS = jUtil.getPureFn(\"mionFormats\", \"isSeconds\");\n  return function is_s_ms(secsAnsMls) {\n    const parts = secsAnsMls.split(\".\");\n    if (parts.length > 2) return false;\n    const secs = parts[0];\n    if (!isS(secs)) return false;\n    const mls = parts[1];\n    if (mls) {\n      if (mls.length !== 3) return false;\n      const millisNumber = Number(mls);\n      if (isNaN(millisNumber)) return false;\n      if (millisNumber < 0 || millisNumber > 999) return false;\n    }\n    return true;\n  };",fnName:"isSecondsWithMs",bodyHash:"w-3AxO5Z-3h_a6",pureFnDependencies:["isSeconds"],createPureFn:function get_isSecondsWithMs(jUtil){const isS = jUtil.getPureFn("mionFormats", "isSeconds");
  return function is_s_ms(secsAnsMls) {
    const parts = secsAnsMls.split(".");
    if (parts.length > 2) return false;
    const secs = parts[0];
    if (!isS(secs)) return false;
    const mls = parts[1];
    if (mls) {
      if (mls.length !== 3) return false;
      const millisNumber = Number(mls);
      if (isNaN(millisNumber)) return false;
      if (millisNumber < 0 || millisNumber > 999) return false;
    }
    return true;
  };},fn:undefined},"isTimeString_ISO_TZ":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isTWms = jUtil.getPureFn(\"mionFormats\", \"isTimeString_ISO\");\n  const isTZ = jUtil.getPureFn(\"mionFormats\", \"isTimeZone\");\n  return function is_iso_time(value) {\n    const isZ = value.endsWith(\"Z\") || value.endsWith(\"z\");\n    const isPositiveTZ = isZ || value.indexOf(\"+\") !== -1;\n    const isNegativeTZ = isZ || value.indexOf(\"-\") !== -1;\n    if (!isZ && !isPositiveTZ && !isNegativeTZ) return false;\n    const timeAndTz = isZ ? [value.substring(0, value.length - 1), \"Z\"] : value.split(isPositiveTZ ? \"+\" : \"-\");\n    if (timeAndTz.length !== 2) return false;\n    const time = timeAndTz[0];\n    const tz = timeAndTz[1];\n    return isTWms(time) && isTZ(tz);\n  };",fnName:"isTimeString_ISO_TZ",bodyHash:"NCB_K_7BF-8PZQ",pureFnDependencies:["isTimeString_ISO","isTimeZone"],createPureFn:function get_isTimeString_ISO_TZ(jUtil){const isTWms = jUtil.getPureFn("mionFormats", "isTimeString_ISO");
  const isTZ = jUtil.getPureFn("mionFormats", "isTimeZone");
  return function is_iso_time(value) {
    const isZ = value.endsWith("Z") || value.endsWith("z");
    const isPositiveTZ = isZ || value.indexOf("+") !== -1;
    const isNegativeTZ = isZ || value.indexOf("-") !== -1;
    if (!isZ && !isPositiveTZ && !isNegativeTZ) return false;
    const timeAndTz = isZ ? [value.substring(0, value.length - 1), "Z"] : value.split(isPositiveTZ ? "+" : "-");
    if (timeAndTz.length !== 2) return false;
    const time = timeAndTz[0];
    const tz = timeAndTz[1];
    return isTWms(time) && isTZ(tz);
  };},fn:undefined},"isTimeString_ISO":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isH = jUtil.getPureFn(\"mionFormats\", \"isHours\");\n  const isM = jUtil.getPureFn(\"mionFormats\", \"isMinutes\");\n  const isSWithMls = jUtil.getPureFn(\"mionFormats\", \"isSecondsWithMs\");\n  return function is_iso_time(value) {\n    const parts = value.split(\":\");\n    return parts.length === 3 && isH(parts[0]) && isM(parts[1]) && isSWithMls(parts[2]);\n  };",fnName:"isTimeString_ISO",bodyHash:"joUIF3KmQA7Aws",pureFnDependencies:["isHours","isMinutes","isSecondsWithMs"],createPureFn:function get_isTimeString_ISO(jUtil){const isH = jUtil.getPureFn("mionFormats", "isHours");
  const isM = jUtil.getPureFn("mionFormats", "isMinutes");
  const isSWithMls = jUtil.getPureFn("mionFormats", "isSecondsWithMs");
  return function is_iso_time(value) {
    const parts = value.split(":");
    return parts.length === 3 && isH(parts[0]) && isM(parts[1]) && isSWithMls(parts[2]);
  };},fn:undefined},"isTimeString_HHmmss":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isH = jUtil.getPureFn(\"mionFormats\", \"isHours\");\n  const isM = jUtil.getPureFn(\"mionFormats\", \"isMinutes\");\n  const isS = jUtil.getPureFn(\"mionFormats\", \"isSeconds\");\n  return function is_iso_time(value) {\n    const parts = value.split(\":\");\n    return parts.length === 3 && isH(parts[0]) && isM(parts[1]) && isS(parts[2]);\n  };",fnName:"isTimeString_HHmmss",bodyHash:"QU-R606PNQuAQE",pureFnDependencies:["isHours","isMinutes","isSeconds"],createPureFn:function get_isTimeString_HHmmss(jUtil){const isH = jUtil.getPureFn("mionFormats", "isHours");
  const isM = jUtil.getPureFn("mionFormats", "isMinutes");
  const isS = jUtil.getPureFn("mionFormats", "isSeconds");
  return function is_iso_time(value) {
    const parts = value.split(":");
    return parts.length === 3 && isH(parts[0]) && isM(parts[1]) && isS(parts[2]);
  };},fn:undefined},"isTimeString_HHmm":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isH = jUtil.getPureFn(\"mionFormats\", \"isHours\");\n  const isM = jUtil.getPureFn(\"mionFormats\", \"isMinutes\");\n  return function is_iso_time(value) {\n    const parts = value.split(\":\");\n    return parts.length === 2 && isH(parts[0]) && isM(parts[1]);\n  };",fnName:"isTimeString_HHmm",bodyHash:"wK8lBvI2O4XQ09",pureFnDependencies:["isHours","isMinutes"],createPureFn:function get_isTimeString_HHmm(jUtil){const isH = jUtil.getPureFn("mionFormats", "isHours");
  const isM = jUtil.getPureFn("mionFormats", "isMinutes");
  return function is_iso_time(value) {
    const parts = value.split(":");
    return parts.length === 2 && isH(parts[0]) && isM(parts[1]);
  };},fn:undefined},"isTimeString_mmss":{namespace:"mionFormats",paramNames:["jUtil"],code:"const isM = jUtil.getPureFn(\"mionFormats\", \"isMinutes\");\n  const isS = jUtil.getPureFn(\"mionFormats\", \"isSeconds\");\n  return function is_iso_time(value) {\n    const parts = value.split(\":\");\n    return parts.length === 2 && isM(parts[0]) && isS(parts[1]);\n  };",fnName:"isTimeString_mmss",bodyHash:"HBjntCm7aZu5JG",pureFnDependencies:["isMinutes","isSeconds"],createPureFn:function get_isTimeString_mmss(jUtil){const isM = jUtil.getPureFn("mionFormats", "isMinutes");
  const isS = jUtil.getPureFn("mionFormats", "isSeconds");
  return function is_iso_time(value) {
    const parts = value.split(":");
    return parts.length === 2 && isM(parts[0]) && isS(parts[1]);
  };},fn:undefined},"isUUID":{namespace:"mionFormats",paramNames:[],code:"return function is_uuid(value, p) {\n    if (value.length !== 36) return false;\n    for (let i = 0; i < 36; i++) {\n      if (i === 8 || i === 13 || i === 18 || i === 23) {\n        if (value[i] !== \"-\") return false;\n      } else if (i === 14) {\n        if (value[i] !== p.version) return false;\n      } else {\n        const charCode = value.charCodeAt(i);\n        const is09 = charCode >= 48 && charCode <= 57;\n        const isaf = charCode >= 97 && charCode <= 102;\n        const isAF = charCode >= 65 && charCode <= 70;\n        if (!(is09 || isaf || isAF)) return false;\n      }\n    }\n    return true;\n  };",fnName:"isUUID",bodyHash:"32EsOFrtBtCSbQ",pureFnDependencies:[],createPureFn:function get_isUUID(){return function is_uuid(value, p) {
    if (value.length !== 36) return false;
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        if (value[i] !== "-") return false;
      } else if (i === 14) {
        if (value[i] !== p.version) return false;
      } else {
        const charCode = value.charCodeAt(i);
        const is09 = charCode >= 48 && charCode <= 57;
        const isaf = charCode >= 97 && charCode <= 102;
        const isAF = charCode >= 65 && charCode <= 70;
        if (!(is09 || isaf || isAF)) return false;
      }
    }
    return true;
  };},fn:undefined},"isLocalHost":{namespace:"mionFormats",paramNames:[],code:"const lhr = /^localhost$/i;\n  return function is_local_host(ip, p) {\n    if (p.version === 4) return lhr.test(ip) || ip === \"127:0:0:1\";\n    if (p.version === 6) return ip === \"::1\" || ip === \"0:0:0:0:0:0:0:1\";\n    return lhr.test(ip) || ip === \"127:0:0:1\" || ip === \"::1\" || ip === \"0:0:0:0:0:0:0:1\";\n  };",fnName:"isLocalHost",bodyHash:"ik5yJC7tT_L6xO",pureFnDependencies:[],createPureFn:function get_isLocalHost(){const lhr = /^localhost$/i;
  return function is_local_host(ip, p) {
    if (p.version === 4) return lhr.test(ip) || ip === "127:0:0:1";
    if (p.version === 6) return ip === "::1" || ip === "0:0:0:0:0:0:0:1";
    return lhr.test(ip) || ip === "127:0:0:1" || ip === "::1" || ip === "0:0:0:0:0:0:0:1";
  };},fn:undefined},"isIPV4":{namespace:"mionFormats",paramNames:["utl"],code:"const is_Localhost = utl.getPureFn(\"mionFormats\", \"isLocalHost\");\n  function get_address(ip, p) {\n    if (!p.allowPort) return ip;\n    const parts = ip.split(\":\");\n    if (parts.length > 2) return false;\n    const [address, portS] = parts;\n    if (!portS) return address;\n    const port = Number(portS);\n    if (isNaN(port) || port < 0 || port > 65535) return false;\n    return address;\n  }\n  return function is_ip_v4(ip, p) {\n    const address = get_address(ip, p);\n    if (address === false) return false;\n    const isLocal = is_Localhost(address, p);\n    if (p.allowLocalHost && isLocal) return true;\n    if (!p.allowLocalHost && isLocal) return false;\n    const sections = address.split(\".\");\n    if (sections.length !== 4) return false;\n    for (const section of sections) {\n      const num = Number(section);\n      if (isNaN(num) || num < 0 || num > 255) return false;\n    }\n    return true;\n  };",fnName:"isIPV4",bodyHash:"DL89ezU80jTaqc",pureFnDependencies:["isLocalHost"],createPureFn:function get_isIPV4(utl){const is_Localhost = utl.getPureFn("mionFormats", "isLocalHost");
  function get_address(ip, p) {
    if (!p.allowPort) return ip;
    const parts = ip.split(":");
    if (parts.length > 2) return false;
    const [address, portS] = parts;
    if (!portS) return address;
    const port = Number(portS);
    if (isNaN(port) || port < 0 || port > 65535) return false;
    return address;
  }
  return function is_ip_v4(ip, p) {
    const address = get_address(ip, p);
    if (address === false) return false;
    const isLocal = is_Localhost(address, p);
    if (p.allowLocalHost && isLocal) return true;
    if (!p.allowLocalHost && isLocal) return false;
    const sections = address.split(".");
    if (sections.length !== 4) return false;
    for (const section of sections) {
      const num = Number(section);
      if (isNaN(num) || num < 0 || num > 255) return false;
    }
    return true;
  };},fn:undefined},"isIPV6":{namespace:"mionFormats",paramNames:["utl"],code:"const is_Localhost = utl.getPureFn(\"mionFormats\", \"isLocalHost\");\n  const ipv6PortRegexp = /^\\[([^\\]]+)\\](?::(\\d+))?$/;\n  function get_address(ip, p) {\n    if (!p.allowPort) return ip;\n    const match = ip.match(ipv6PortRegexp);\n    if (!match) return false;\n    const address = match[1];\n    const port = match[2];\n    if (!port) return address;\n    const num = Number(port);\n    if (isNaN(num) || num < 0 || num > 65535) return false;\n    return address;\n  }\n  return function is_ip_v6(ip, p) {\n    const address = get_address(ip, p);\n    if (address === false) return false;\n    const isLocal = is_Localhost(address, p);\n    if (p.allowLocalHost && isLocal) return true;\n    if (!p.allowLocalHost && isLocal) return false;\n    const sections = address.split(\":\");\n    if (sections.length < 3 || sections.length > 8) return false;\n    let doubleColon = 0;\n    for (const section of sections) {\n      if (section.length === 0) {\n        doubleColon++;\n        if (doubleColon > 1) return false;\n        continue;\n      }\n      if (section.length > 4) return false;\n      const num = parseInt(section, 16);\n      if (isNaN(num) || num < 0 || num > 65535) return false;\n    }\n    return true;\n  };",fnName:"isIPV6",bodyHash:"SL4Gk3IId9J6aa",pureFnDependencies:["isLocalHost"],createPureFn:function get_isIPV6(utl){const is_Localhost = utl.getPureFn("mionFormats", "isLocalHost");
  const ipv6PortRegexp = /^\[([^\]]+)\](?::(\d+))?$/;
  function get_address(ip, p) {
    if (!p.allowPort) return ip;
    const match = ip.match(ipv6PortRegexp);
    if (!match) return false;
    const address = match[1];
    const port = match[2];
    if (!port) return address;
    const num = Number(port);
    if (isNaN(num) || num < 0 || num > 65535) return false;
    return address;
  }
  return function is_ip_v6(ip, p) {
    const address = get_address(ip, p);
    if (address === false) return false;
    const isLocal = is_Localhost(address, p);
    if (p.allowLocalHost && isLocal) return true;
    if (!p.allowLocalHost && isLocal) return false;
    const sections = address.split(":");
    if (sections.length < 3 || sections.length > 8) return false;
    let doubleColon = 0;
    for (const section of sections) {
      if (section.length === 0) {
        doubleColon++;
        if (doubleColon > 1) return false;
        continue;
      }
      if (section.length > 4) return false;
      const num = parseInt(section, 16);
      if (isNaN(num) || num < 0 || num > 65535) return false;
    }
    return true;
  };},fn:undefined},"mionGetIPErrors":{namespace:"mionFormats",paramNames:["utl"],code:"const is_ip_v4 = utl.getPureFn(\"mionFormats\", \"isIPV4\");\n  const is_ip_v6 = utl.getPureFn(\"mionFormats\", \"isIPV6\");\n  const noopDeps = {};\n  return function get_ip_errors(ip, p, fPath, fErrs, name = \"ip\") {\n    if (p.version === 4 && !is_ip_v4(ip, p, noopDeps))\n      return fErrs.push({ name, formatPath: [...fPath, \"version\"], val: 4 }), fErrs;\n    if (p.version === 6 && !is_ip_v6(ip, p, noopDeps))\n      return fErrs.push({ name, formatPath: [...fPath, \"version\"], val: 6 }), fErrs;\n    const isIP = is_ip_v4(ip, p, noopDeps) || is_ip_v6(ip, p, noopDeps);\n    if (!isIP) fErrs.push({ name, formatPath: [\"version\"], val: \"any\" });\n    return fErrs;\n  };",fnName:"mionGetIPErrors",bodyHash:"DqM0k2QRxqOTpQ",pureFnDependencies:["isIPV4","isIPV6"],createPureFn:function get_mionGetIPErrors(utl){const is_ip_v4 = utl.getPureFn("mionFormats", "isIPV4");
  const is_ip_v6 = utl.getPureFn("mionFormats", "isIPV6");
  const noopDeps = {};
  return function get_ip_errors(ip, p, fPath, fErrs, name = "ip") {
    if (p.version === 4 && !is_ip_v4(ip, p, noopDeps))
      return fErrs.push({ name, formatPath: [...fPath, "version"], val: 4 }), fErrs;
    if (p.version === 6 && !is_ip_v6(ip, p, noopDeps))
      return fErrs.push({ name, formatPath: [...fPath, "version"], val: 6 }), fErrs;
    const isIP = is_ip_v4(ip, p, noopDeps) || is_ip_v6(ip, p, noopDeps);
    if (!isIP) fErrs.push({ name, formatPath: ["version"], val: "any" });
    return fErrs;
  };},fn:undefined}},"mion":{"asJSONString":{namespace:"mion",paramNames:[],code:"if (typeof Bun !== \"undefined\") return JSON.stringify;\n  const STR_ESCAPE = /[\\u0000-\\u001f\\u0022\\u005c\\ud800-\\udfff]/;\n  const MAX_SCAPE_TEST_LENGTH = 1e3;\n  return function _asJSONStringRegexOnly(str) {\n    if (str.length < MAX_SCAPE_TEST_LENGTH && STR_ESCAPE.test(str) === false) {\n      return '\"' + str + '\"';\n    } else {\n      return JSON.stringify(str);\n    }\n  };",fnName:"asJSONString",bodyHash:"4WYkR03dXOzAUe",pureFnDependencies:[],createPureFn:function get_asJSONString(){if (typeof Bun !== "undefined") return JSON.stringify;
  const STR_ESCAPE = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
  const MAX_SCAPE_TEST_LENGTH = 1e3;
  return function _asJSONStringRegexOnly(str) {
    if (str.length < MAX_SCAPE_TEST_LENGTH && STR_ESCAPE.test(str) === false) {
      return '"' + str + '"';
    } else {
      return JSON.stringify(str);
    }
  };},fn:undefined},"getUnknownKeysFromArray":{namespace:"mion",paramNames:[],code:"const MAX_UNKNOWN_KEYS = 10;\n  return function _getUnknownKeysFromArray(obj, keys) {\n    const unknownKeys = [];\n    for (const prop in obj) {\n      let found = false;\n      for (let j = 0; j < keys.length; j++) {\n        if (keys[j] === prop) {\n          found = true;\n          break;\n        }\n      }\n      if (!found) {\n        unknownKeys.push(prop);\n        if (unknownKeys.length >= MAX_UNKNOWN_KEYS) throw new Error(\"Too many unknown keys\");\n      }\n    }\n    return unknownKeys;\n  };",fnName:"getUnknownKeysFromArray",bodyHash:"D2CDXI8OoGLGyW",pureFnDependencies:[],createPureFn:function get_getUnknownKeysFromArray(){const MAX_UNKNOWN_KEYS = 10;
  return function _getUnknownKeysFromArray(obj, keys) {
    const unknownKeys = [];
    for (const prop in obj) {
      let found = false;
      for (let j = 0; j < keys.length; j++) {
        if (keys[j] === prop) {
          found = true;
          break;
        }
      }
      if (!found) {
        unknownKeys.push(prop);
        if (unknownKeys.length >= MAX_UNKNOWN_KEYS) throw new Error("Too many unknown keys");
      }
    }
    return unknownKeys;
  };},fn:undefined},"hasUnknownKeysFromArray":{namespace:"mion",paramNames:[],code:"return function _hasUnknownKeysFromArray(obj, keys) {\n    for (const prop in obj) {\n      let found = false;\n      for (let j = 0; j < keys.length; j++) {\n        if (keys[j] === prop) {\n          found = true;\n          break;\n        }\n      }\n      if (!found) return true;\n    }\n    return false;\n  };",fnName:"hasUnknownKeysFromArray",bodyHash:"K7uzDGNnPwcqQ9",pureFnDependencies:[],createPureFn:function get_hasUnknownKeysFromArray(){return function _hasUnknownKeysFromArray(obj, keys) {
    for (const prop in obj) {
      let found = false;
      for (let j = 0; j < keys.length; j++) {
        if (keys[j] === prop) {
          found = true;
          break;
        }
      }
      if (!found) return true;
    }
    return false;
  };},fn:undefined},"newRunTypeErr":{namespace:"mion",paramNames:[],code:"return function _err(p\\u03BBth, \\u03B5rr, expected, accessPath) {\n    const path = accessPath?.length ? [...p\\u03BBth, ...accessPath] : [...p\\u03BBth];\n    const runTypeErr = { expected, path };\n    \\u03B5rr.push(runTypeErr);\n  };",fnName:"newRunTypeErr",bodyHash:"eCwDrS1nuSv7ge",pureFnDependencies:[],createPureFn:function get_newRunTypeErr(){return function _err(p\u03BBth, \u03B5rr, expected, accessPath) {
    const path = accessPath?.length ? [...p\u03BBth, ...accessPath] : [...p\u03BBth];
    const runTypeErr = { expected, path };
    \u03B5rr.push(runTypeErr);
  };},fn:undefined},"formatErr":{namespace:"mion",paramNames:[],code:"return function _formatErr(p\\u03BBth, \\u03B5rr, expected, fmtName, paramName, paramVal, fmtPath, accessPath, fmtAccessPath) {\n    const path = accessPath?.length ? [...p\\u03BBth, ...accessPath] : [...p\\u03BBth];\n    const formatPath = fmtAccessPath?.length ? [...fmtPath, ...fmtAccessPath, paramName] : [...fmtPath, paramName];\n    const format = { name: fmtName, formatPath, val: paramVal };\n    const runTypeErr = { expected, path, format };\n    \\u03B5rr.push(runTypeErr);\n  };",fnName:"formatErr",bodyHash:"2isPiuLWPtohVR",pureFnDependencies:[],createPureFn:function get_formatErr(){return function _formatErr(p\u03BBth, \u03B5rr, expected, fmtName, paramName, paramVal, fmtPath, accessPath, fmtAccessPath) {
    const path = accessPath?.length ? [...p\u03BBth, ...accessPath] : [...p\u03BBth];
    const formatPath = fmtAccessPath?.length ? [...fmtPath, ...fmtAccessPath, paramName] : [...fmtPath, paramName];
    const format = { name: fmtName, formatPath, val: paramVal };
    const runTypeErr = { expected, path, format };
    \u03B5rr.push(runTypeErr);
  };},fn:undefined},"safeIterableKey":{namespace:"mion",paramNames:[],code:"return function _safeKey(value) {\n    if (value === void 0) return null;\n    if (value === null) return null;\n    const type = typeof value;\n    if (type === \"number\" || type === \"string\" || type === \"boolean\") return value;\n    return null;\n  };",fnName:"safeIterableKey",bodyHash:"BrjL47E-GRjUpQ",pureFnDependencies:[],createPureFn:function get_safeIterableKey(){return function _safeKey(value) {
    if (value === void 0) return null;
    if (value === null) return null;
    const type = typeof value;
    if (type === "number" || type === "string" || type === "boolean") return value;
    return null;
  };},fn:undefined}}};
