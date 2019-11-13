import TLE from './TLE';

/**
 * merge two objects together, b takes precedence
 * @param   {Object} a - First object instance
 * @param   {Object} b - Second object instance
 * @returns {Object}
 */
export const mergeOpts = function(a: number[], b: number[]): {[id: string]: any} {
  let k;
  let result: {[id: string]: any} = {};
  for(k in a) result[k] = a[k];
  for(k in b) result[k] = b[k];
  return result;
};

/**
 * takes a Date instance and return julian day
 * @param   {Date} date - Date instance
 * @returns {float}
 */
export const jday = function(date: Date): number {
  return (date.getTime() / 86400000.0) + 2440587.5;
};

/**
 * takes a Date instance and returns Greenwich mean sidereal time in radii
 * @param   {Date} date - Date instance
 * @returns {float}
 */
export const gmst = function(date: Date): number {
  let jd = jday(date);
  //t is the time difference in Julian centuries of Universal Time (UT1) from J2000.0.
  let t = (jd - 2451545.0) / 36525;
  // based on http://www.space-plasma.qmul.ac.uk/heliocoords/systems2art/node10.html
  let gmst = 67310.54841 + (876600.0*3600 + 8640184.812866) * t + 0.093104 * t*t - 0.0000062 * t*t*t;
  gmst = (gmst * (Math.PI/180) / 240.0) % (Math.PI*2);
  gmst += (gmst<0) ? Math.PI*2 : 0;
  return gmst;
};

/**
 * Get distance to true horizon in meters
 * @param   {float} altitude - In meters
 * @returns {float}
 */
export const getDistanceToHorizon = function(altitude: number): number {
  return Math.sqrt(12.756 * altitude) * 1000;
};

export const halfEarthCircumference = 6371 * Math.PI * 500;

/**
 * Calculate position of the sun for a given date
 * @param   {Date} date - An instance of Date
 * @returns {float[]} [latitude, longitude]
 */
export const calculatePositionOfSun = function(date: Date): [number, number] {
  date = (date instanceof Date) ? date : new Date();

  let rad = 0.017453292519943295;

  // based on NOAA solar calculations
  let mins_past_midnight = (date.getUTCHours() * 60 + date.getUTCMinutes()) / 1440;
  let jc = (jday(date) - 2451545)/36525;
  let mean_long_sun = (280.46646+jc*(36000.76983+jc*0.0003032)) % 360;
  let mean_anom_sun = 357.52911+jc*(35999.05029-0.0001537*jc);
  let sun_eq = Math.sin(rad*mean_anom_sun)*(1.914602-jc*(0.004817+0.000014*jc))+Math.sin(rad*2*mean_anom_sun)*(0.019993-0.000101*jc)+Math.sin(rad*3*mean_anom_sun)*0.000289;
  let sun_true_long = mean_long_sun + sun_eq;
  let sun_app_long = sun_true_long - 0.00569 - 0.00478*Math.sin(rad*125.04-1934.136*jc);
  let mean_obliq_ecliptic = 23+(26+((21.448-jc*(46.815+jc*(0.00059-jc*0.001813))))/60)/60;
  let obliq_corr = mean_obliq_ecliptic + 0.00256*Math.cos(rad*125.04-1934.136*jc);
  let lat = Math.asin(Math.sin(rad*obliq_corr)*Math.sin(rad*sun_app_long)) / rad;
  let eccent = 0.016708634-jc*(0.000042037+0.0000001267*jc);
  let y = Math.tan(rad*(obliq_corr/2))*Math.tan(rad*(obliq_corr/2));
  let rq_of_time = 4*((y*Math.sin(2*rad*mean_long_sun)-2*eccent*Math.sin(rad*mean_anom_sun)+4*eccent*y*Math.sin(rad*mean_anom_sun)*Math.cos(2*rad*mean_long_sun)-0.5*y*y*Math.sin(4*rad*mean_long_sun)-1.25*eccent*eccent*Math.sin(2*rad*mean_anom_sun))/rad);
  let true_solar_time = (mins_past_midnight*1440+rq_of_time) % 1440;
  let lng = -((true_solar_time/4 < 0) ? true_solar_time/4 + 180 : true_solar_time/4 - 180);

  return [lat, lng];
};

/**
 * Calculate LatLng of the sun for a given date
 * @param   {Date} date - An instance of Date
 * @returns {google.maps.LatLng}
 */
export const calculateLatLngOfSun = function(date: Date): {latitude: number, longitude: number} {
  let pos = calculatePositionOfSun(date);
  return {latitude: pos[0], longitude: pos[1]};
};

/**
 * Parses a string with one or more TLEs
 * @param       {string} text - A string containing one or more TLEs
 * @returns     {array.<orbits.TLE>} An array of orbit.TLE instances
 */
export const parseTLE = function(list: {title: string, line1: string, line2:string}[]): TLE[] {
  let array: TLE[] = [];

  list.forEach(v =>
    array.push(new TLE(v.title, v.line1, v.line2))
  );

  return array;
};

export const toRadians = function(degrees: number) {
  let pi = Math.PI;
  return degrees * (pi/180);
}


export const distanceBetween = (cord1: {latitude: number, longitude: number}, cord2: {latitude: number, longitude: number}): number => {
  const R = 6371e3; // metres
  let lat1Rad = toRadians(cord1.latitude);
  let lat2Rad = toRadians(cord2.latitude);
  let latPairRad = toRadians(cord2.latitude-cord1.latitude);
  let lngPairRad = toRadians(cord2.longitude-cord1.longitude);

  let a = Math.sin(latPairRad/2) * Math.sin(latPairRad/2) +
          Math.cos(lat1Rad) * Math.cos(lat2Rad) *
          Math.sin(lngPairRad/2) * Math.sin(lngPairRad/2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  let d = R * c;
  return d;
}