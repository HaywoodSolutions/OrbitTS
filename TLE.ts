import { jday } from './Utils';

export default class TLE {
  readonly name: string;
  readonly line1: string;
  readonly line2: string;

  readonly satelite_number: number; // Satellite Number
  readonly classification: string; // Classification (U=Unclassified)
  readonly intd_year: string; // International Designator (Last two digits of launch year, eg. '98')
  readonly intd_ln: string; // International Designator (Launch number of the year, eg. '067')
  readonly intd_place: string; // International Designator (Piece of the launch, eg. 'A')
  readonly intd: string; // International Designator (eg. 98067A)
  readonly epoch_year: number; // Epoch Year (Full year)
  readonly epoch_day: number; // Epoch (Day of the year and fractional portion of the day)
  readonly ftd: number; // First Time Derivative of the Mean Motion divided by two
  readonly std: number; // Second Time Derivative of Mean Motion divided by six
  readonly bstar: number; // BSTAR drag term
  readonly ehemeris_type: number; // The number 0 (Originally this should have been "Ephemeris type")
  readonly element_number: number; // Element set number. incremented when a new TLE is generated for this object.
  readonly inclination: number; // Inclination [Degrees]
  readonly right_ascension: number; // Right Ascension of the Ascending Node [Degrees]
  readonly eccentricity: number; // Eccentricity
  readonly argument_of_perigee: number; // Argument of Perigee [Degrees]
  readonly mean_anomaly: number; // Mean Anomaly [Degrees]
  readonly mean_motion: number; // Mean Motion [Revs per day]
  readonly epoch_rev_number: number; // Revolution number at epoch [Revs]

  static checkLine(str: string): boolean {
    const checkSum = parseInt(str.charAt(str.length-1));
    const testStr = str.substring(0, 68);
    let value = 0;
    for (let i=0; i<testStr.length; i++) {
      switch(testStr.charAt(i)) {
        case '1': value += 1; break;
        case '2': value += 2; break;
        case '3': value += 3; break;
        case '4': value += 4; break;
        case '5': value += 5; break;
        case '6': value += 6; break;
        case '7': value += 7; break;
        case '8': value += 8; break;
        case '9': value += 9; break;
        case '-': value += 1; break;
      }
    }
    return (value % 10) == checkSum;
  }

  constructor(name: string, line1: string, line2: string) {
    this.name = name;
    this.line1 = line1;
    this.line2 = line2;

    if(!TLE.checkLine(this.line1) || !TLE.checkLine(this.line2)) throw new SyntaxError("Invalid TLE syntax");

    if(this.line1[0] != "1") throw new SyntaxError("Invalid TLE syntax");
    if(this.line2[0] != "2") throw new SyntaxError("Invalid TLE syntax");

    this.satelite_number = parseInt(this.line1.substring(2,7));
    this.classification = this.line1.substring(7,8);
    this.intd_year = this.line1.substring(9,11);
    this.intd_ln = this.line1.substring(11,14);
    this.intd_place = this.line1.substring(14,17).trim();
    this.intd = this.line1.substring(9,17).trim();
    this.epoch_year = parseInt(this.line1.substring(18,20));
    this.epoch_year += (this.epoch_year < 57) ? 2000 : 1000;
    this.epoch_day = parseFloat(this.line1.substring(20,32));
    this.ftd = parseFloat(this.line1.substring(33,43));

    this.std = 0;
    let tmp = this.line1.substring(44,52).split(/[+-]/);
    this.std = (tmp.length == 3) ?-1 * parseFloat("."+tmp[1].trim()) * Math.pow(10,-parseInt(tmp[2])) : parseFloat("."+tmp[0].trim()) * Math.pow(10,-parseInt(tmp[1]));

    this.bstar = 0;
    tmp = this.line1.substring(53,61).split(/[+-]/);
    this.bstar = (tmp.length == 3) ? -1 * parseFloat("."+tmp[1].trim()) * Math.pow(10,-parseInt(tmp[2])) : parseFloat("."+tmp[0].trim()) * Math.pow(10,-parseInt(tmp[1]));

    this.ehemeris_type = parseInt(this.line1.substring(62,63));
    this.element_number = parseInt(this.line1.substring(64,68));

    this.inclination = parseFloat(this.line2.substring(8,16));
    this.right_ascension = parseFloat(this.line2.substring(17,25));
    this.eccentricity = parseFloat("."+this.line2.substring(26,33).trim());
    this.argument_of_perigee = parseFloat(this.line2.substring(34,42));
    this.mean_anomaly = parseFloat(this.line2.substring(43,51));
    this.mean_motion = parseFloat(this.line2.substring(52,63));
    this.epoch_rev_number = parseInt(this.line2.substring(63,68));
  }
    
  /**
   * Takes a date instance and returns the different between it and TLE's epoch
   * @param       {Date} date - A instance of Date
   * @returns     {int} delta time in millis
   */
  dtime(date: Date): number {
    const a = jday(date);
    const b = jday(new Date(Date.UTC(this.epoch_year, 0, 0, 0, 0, 0) + this.epoch_day * 86400000));
    return (a - b) * 1440.0; // in minutes
  };

  /**
   * Returns the TLE string
   * @returns {string} TLE string in 3 lines
   */
  toString(): string {
    return `${this.name}\n${this.line1}\n${this.line2}`;
  };
}