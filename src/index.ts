import box from "3box";

export interface PaymentRequest {
  from: string,
  amount: number,
  currency: string
}

export const SPLIT_NETWORK_NOTIF_SPACE = "split-network-notif-space";

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
    this.box = await box.openBox(this.address, this.provider);
    this.space = await this.box.openSpace(SPLIT_NETWORK_NOTIF_SPACE);
  }

  async request(requests: PaymentRequest[]): Promise<string[]> {
    return await Promise.all(
      requests.map(this.singleRequest)
    );
  }

  private singleRequest = async (request: PaymentRequest): Promise<string> => {
    const thread = await this.space.joinThread(`split-requests-${request.from}`, {firstModerator: request.from, members: false});
    const postId = await thread.post(JSON.stringify(request));
    console.log(postId);
    return postId;
  }

}
