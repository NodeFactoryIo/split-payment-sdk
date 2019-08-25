import box from "3box";

export interface PaymentRequest {
  from: string,
  amount: number,
  currency: string,
  to: string,
}

export const SPLIT_NETWORK_NOTIF_SPACE = "split-network-space-notif";

export const MODERATOR = "0x4ae2be02E9746B39e34029b334320026b842BB82";

/**
 * Class used for sending payment requests.
 * Intended to use in wallets and dapps.
 */
export class Requester {

  private address: string;

  private provider: any;

  private box: any;

  private space: any;

  /**
   * @param address eth address of your account that want's to split some payment
   * @param provider web3 provider (metamask, portis, etc)
   */
  constructor(address: string, provider: any) {
    this.address = address;
    this.provider = provider;
  }

  /**
   * Authroizes 3box and spaces required for sending notification.
   */
  async init(): Promise<void> {
    return await new Promise(async (resolve) => {
      this.box = await box.openBox(this.address, this.provider);
      this.space = await this.box.openSpace(SPLIT_NETWORK_NOTIF_SPACE, {onSyncDone: () => {
        resolve();
        }});
    });
  }

  /**
   * Request payment from multiple eth users/wallets
   * Make sure you call {@link init} before requesting payment
   * @param requests
   */
  async request(requests: PaymentRequest[]): Promise<string[]> {
    return await Promise.all(
      requests.map(this.singleRequest)
    );
  }

  private singleRequest = async (request: PaymentRequest): Promise<string> => {
    const thread = await this.space.joinThread(getThreadName(request.from), {firstModerator: MODERATOR, members: false});
    return await thread.post(JSON.stringify(request));
  }

}


/**
 * Class used for fetching and listening on new payment requests-
 * Intended to be used in wallets
 */
export class SplitWallet {

  private address: string;

  private pollingPeriod: number;

  private callbacks: Function[] = [];

  private poll: NodeJS.Timeout;

  private totalRequestCount;

  /**
   * This will not start polling. Check {@link startPolling}
   * @param address your ethereum address that will receive payment requests
   * @param pollingPeriod number of miliseconds before new check for pending payment requests
   */
  constructor(address: string, pollingPeriod?: number) {
    this.address = address;
    this.pollingPeriod = pollingPeriod || 2000;
  }

  static async getAllPaymentRequests(address: string): Promise<PaymentRequest[]> {
    return (await SplitWallet.getRawPaymentRequests(address))
      .map((post) => JSON.parse(post.message));
  }

  /**
   * Returns raw 3box thread messages
   * @param address
   */
  static async getRawPaymentRequests(address: string): Promise<[{postId: string, message: string}]> {
    return await box.getThread(SPLIT_NETWORK_NOTIF_SPACE, getThreadName(address), MODERATOR, false)
  }

  /**
   * Subscribes on new payment requests
   * @param callback method to be called, first param will be {@link PaymentRequest}
   */
  onNewPaymentRequest(callback: (request: PaymentRequest) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Starts polling for new payment requests.
   * Cannot be called twice in a row.
   */
  public async startPolling(): Promise<void> {
    if(this.poll) {
      throw new Error("Poll already running");
    }
    this.totalRequestCount = (await SplitWallet.getRawPaymentRequests(this.address)).length;
    this.poll = setInterval(async() => {
      const paymentRequests = await SplitWallet.getAllPaymentRequests(this.address);
      if(paymentRequests.length > this.totalRequestCount) {
        this.sendNotifications(paymentRequests[paymentRequests.length - 1]);
        this.totalRequestCount = paymentRequests.length;
      }
    }, this.pollingPeriod);
  }

  /**
   * Stops polling
   */
  public stopPolling(): void {
    clearInterval(this.poll);
    this.poll = null;
  }

  private sendNotifications(paymentRequest: PaymentRequest): void {
    this.callbacks.forEach((callback) => callback(paymentRequest));
  }
}

export function getThreadName(address: string): string {
  return `split-requests-${address}`
}
