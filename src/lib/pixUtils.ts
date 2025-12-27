export class PixPayload {
  private merchantName: string;
  private merchantCity: string;
  private pixKey: string;
  private amount: string;
  private txId: string;

  constructor(
    merchantName: string,
    merchantCity: string,
    pixKey: string,
    amount: string,
    txId: string = '***'
  ) {
    this.merchantName = merchantName;
    this.merchantCity = merchantCity;
    this.pixKey = pixKey;
    this.amount = amount;
    this.txId = txId;
  }

  private formatValue(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private getMerchantAccountInfo(): string {
    const gui = this.formatValue('00', 'br.gov.bcb.pix');
    const key = this.formatValue('01', this.pixKey);
    return this.formatValue('26', `${gui}${key}`);
  }

  private getCRC16(payload: string): string {
    let crc = 0xffff;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
      }
    }

    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  }

  public generate(): string {
    const payloadFormatIndicator = this.formatValue('00', '01');
    const merchantAccountInformation = this.getMerchantAccountInfo();
    const merchantCategoryCode = this.formatValue('52', '0000');
    const transactionCurrency = this.formatValue('53', '986'); // BRL
    const transactionAmount = this.formatValue('54', this.amount);
    const countryCode = this.formatValue('58', 'BR');
    const merchantName = this.formatValue('59', this.merchantName.substring(0, 25));
    const merchantCity = this.formatValue('60', this.merchantCity.substring(0, 15));
    const additionalDataFieldTemplate = this.formatValue('62', this.formatValue('05', this.txId));

    let payload = `${payloadFormatIndicator}${merchantAccountInformation}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataFieldTemplate}6304`;

    const crc = this.getCRC16(payload);
    return `${payload}${crc}`;
  }
}
