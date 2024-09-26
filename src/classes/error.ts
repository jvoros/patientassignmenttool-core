export default class ErroniousMonk {
  static log(msg): void {
    const err = new Error(msg);
    console.error("EEEEEEEEEEEE ERROR EEEEEEEEEEE");
    console.error(err);
  }
}
