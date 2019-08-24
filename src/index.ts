import box from "3box";

export interface PaymentRequest {
  from: string,
  amount: number,
  currency: string
}

export const SPLIT_NETWORK_NOTIF_SPACE = "split-network-space-notif";

export const MODERATOR = "0x4ae2be02E9746B39e34029b334320026b842BB82";

export class Requester {

  private address: string;

  private provider: any;

  private box: any;

  private space: any;

  constructor(address: string, provider: any) {
    this.address = address;
    this.provider = provider;
  }

  async init(): Promise<void> {
    return await new Promise(async (resolve) => {
      this.box = await box.openBox(this.address, this.provider);
      this.space = await this.box.openSpace(SPLIT_NETWORK_NOTIF_SPACE, {onSyncDone: () => {
        resolve();
        }});
    });
  }

  async request(requests: PaymentRequest[]): Promise<string[]> {
    return await Promise.all(
      requests.map(this.singleRequest)
    );
  }

  private singleRequest = async (request: PaymentRequest): Promise<string> => {
    const thread = await this.space.joinThread(getThreadName(request.from), {firstModerator: MODERATOR, members: true});
    return await thread.post(JSON.stringify(request));
  }

}

export class SplitWallet {

  private address: string;

  private pollingPeriod: number;

  private callbacks: Function[] = [];

  private poll: NodeJS.Timeout;

  private totalRequestCount;

  constructor(address: string, pollingPeriod?: number) {
    this.address = address;
    this.pollingPeriod = pollingPeriod || 2000;
  }

  static async getAllPaymentRequests(address: string): Promise<PaymentRequest[]> {
    return (await SplitWallet.getRawPaymentRequests(address))
      .map((post) => JSON.parse(post.message));
  }

  static async getRawPaymentRequests(address: string): Promise<[{postId: string, message: string}]> {
    return await box.getThread(SPLIT_NETWORK_NOTIF_SPACE, getThreadName(address), MODERATOR, true)
  }

  onNewPaymentRequest(callback: (request: PaymentRequest) => void): void {
    this.callbacks.push(callback);
  }

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
