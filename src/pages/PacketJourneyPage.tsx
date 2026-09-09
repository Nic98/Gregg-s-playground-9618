import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Network,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import '../packet-journey.css';

type Step = {
  title: string;
  note: string;
  node: number;
  layer: number;
  depth: number;
  hop: number;
  ttl: number;
};
const layers = [
  ['Application 应用层', 'Data', 'HTTP 等协议产生应用数据。', 'Application'],
  [
    'Transport 传输层',
    'TCP segment',
    '本例使用 TCP：加入端口等信息；UDP 使用 datagram。',
    'Transport',
  ],
  [
    'Network 网络层',
    'IP packet',
    '加入源和目的 IP 地址；路由器在这一层选择下一跳。',
    'Internet',
  ],
  [
    'Data link 数据链路层',
    'Ethernet frame',
    '加入当前链路的 MAC 地址和 FCS 错误检测信息。',
    'Network access',
  ],
  [
    'Physical 物理层',
    'Bits / signals',
    '将帧的比特编码成电信号或光信号，在介质上传输。',
    'Network access',
  ],
];
export function journey(remote: boolean): Step[] {
  const start: Step[] = [
    {
      title: 'Create application data',
      note: '浏览器产生 HTTP 数据。跟随这一小块数据，观察外层包装逐步增加。',
      node: 0,
      layer: 0,
      depth: 0,
      hop: 0,
      ttl: 64,
    },
    {
      title: 'Add a TCP header',
      note: 'TCP 加入源端口和目的端口。应用数据成为 TCP segment 的载荷。',
      node: 0,
      layer: 1,
      depth: 1,
      hop: 0,
      ttl: 64,
    },
    {
      title: 'Add an IP header',
      note: 'IP packet 包含 TCP segment。目的 IP 始终指向最终服务器。',
      node: 0,
      layer: 2,
      depth: 2,
      hop: 0,
      ttl: 64,
    },
    {
      title: 'Wrap the packet in an Ethernet frame',
      note: remote
        ? '服务器在另一个子网：目的 MAC 是默认网关接口的 MAC，不是服务器的 MAC。假设 ARP 已完成。'
        : '服务器在同一子网：目的 MAC 直接使用服务器的 MAC。假设 ARP 已完成。',
      node: 0,
      layer: 3,
      depth: 3,
      hop: 0,
      ttl: 64,
    },
    {
      title: 'Send bits as signals',
      note: '帧没有变成另一种嵌套数据包；帧的比特被编码成信号，在网线上传输。',
      node: 0,
      layer: 4,
      depth: 3,
      hop: 0,
      ttl: 64,
    },
    {
      title: 'The switch forwards the frame',
      note: '本例是普通二层交换机：根据目的 MAC 转发。源/目的 MAC 不被换成交换机的 MAC，IP TTL 也不减少。',
      node: 1,
      layer: 3,
      depth: 3,
      hop: 0,
      ttl: 64,
    },
  ];
  if (remote)
    start.push(
      {
        title: 'The router removes the incoming frame',
        note: '路由器接收并检查帧，移除以太网帧头和帧尾，读取里面的 IP packet。',
        node: 2,
        layer: 3,
        depth: 2,
        hop: 0,
        ttl: 64,
      },
      {
        title: 'Route the IP packet',
        note: '根据目的 IP 选择出口；TTL 从 64 减为 63，IPv4 头部校验和随之更新。源/目的 IP 保持不变（本例无 NAT）。',
        node: 2,
        layer: 2,
        depth: 2,
        hop: 1,
        ttl: 63,
      },
      {
        title: 'Build a new Ethernet frame',
        note: '新帧：源 MAC 是路由器出口接口，目的 MAC 是服务器。本例服务器直接连接在出口子网，FCS 为新帧重新计算。',
        node: 2,
        layer: 3,
        depth: 3,
        hop: 1,
        ttl: 63,
      },
    );
  const tail = {
    node: remote ? 3 : 2,
    hop: remote ? 1 : 0,
    ttl: remote ? 63 : 64,
  };
  start.push(
    {
      ...tail,
      title: 'The server receives the signals',
      note: '接收端从信号恢复比特，组成收到的帧。',
      layer: 4,
      depth: 3,
    },
    {
      ...tail,
      title: 'Remove the Ethernet wrapper',
      note: '检查目的 MAC 和 FCS 后，移除帧头和帧尾，将载荷交给 IP。FCS 用于检测错误，不负责修复错误。',
      layer: 3,
      depth: 2,
    },
    {
      ...tail,
      title: 'Pass the payload to TCP',
      note: 'IP 处理 IP 头部，将其中的 TCP segment 交给传输层。',
      layer: 2,
      depth: 1,
    },
    {
      ...tail,
      title: 'Deliver the application data',
      note: 'TCP 根据端口交付数据，并提供有序可靠传输。本例只展示一个数据片段，省略连接建立、ACK 与重传。',
      layer: 1,
      depth: 0,
    },
    {
      ...tail,
      title: 'The application reads the data',
      note: '服务器应用收到原始数据。各层添加的控制信息完成了传输任务，并被逐层处理。',
      layer: 0,
      depth: 0,
    },
  );
  return start;
}

export default function PacketJourneyPage() {
  const [remote, setRemote] = useState(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [field, setField] = useState<string | null>(null);
  const steps = journey(remote);
  const step = steps[index];
  const nodes = remote
    ? ['Your computer', 'Switch', 'Router', 'Server']
    : ['Your computer', 'Switch', 'Server'];
  const destination = remote ? '192.0.2.20' : '192.168.1.20';
  const sourceMac = step.hop ? '02:00:00:00:02:01' : '02:00:00:00:01:10';
  const destinationMac =
    remote && !step.hop ? '02:00:00:00:01:01' : '02:00:00:00:02:20';
  useEffect(() => {
    document.title = 'Packet & Frame Journey · Gregg’s AS Playground';
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (index >= steps.length - 1) setPlaying(false);
      else setIndex(index + 1);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [playing, index, steps.length]);
  function seek(next: number) {
    setIndex(next);
    setPlaying(false);
    setField(null);
  }
  const help: Record<string, string> = {
    Ethernet: `当前帧：${sourceMac} → ${destinationMac}。EtherType 0x0800 表示帧的载荷是 IPv4 packet。MAC 地址用于当前二层网络的交付；经过路由器后，新帧使用新的源/目的 MAC。`,
    IP: `192.168.1.10 → ${destination}。IP 地址标识源和最终目的设备。本例 TTL = ${step.ttl}；路由转发会更新 TTL 和 IPv4 头部校验和。`,
    TCP: '源端口 51514 → 目的端口 80。端口帮助操作系统把数据交给相应应用；TCP 头部还包含序号等信息。',
    Data: '示例 HTTP 请求：GET /lesson。这里只显示应用数据片段，不是完整的 HTTP 报文。',
    FCS: 'Frame Check Sequence：以太网帧尾中的 CRC 错误检测值，覆盖帧头和载荷。路由器构造新帧时重新计算。',
  };
  const data = (
    <button className="pj-piece pj-data" onClick={() => setField('Data')}>
      <strong>Application data</strong>
      <span>GET /lesson</span>
    </button>
  );
  const segment =
    step.depth >= 1 ? (
      <div className="pj-envelope pj-tcp">
        <span className="pj-envelope-label">TCP segment</span>
        <div className="pj-parts">
          <button className="pj-piece" onClick={() => setField('TCP')}>
            <strong>TCP header</strong>
            <span>51514 → 80</span>
          </button>
          {data}
        </div>
      </div>
    ) : (
      data
    );
  const packet =
    step.depth >= 2 ? (
      <div className="pj-envelope pj-ip">
        <span className="pj-envelope-label">IP packet</span>
        <div className="pj-parts">
          <button className="pj-piece" onClick={() => setField('IP')}>
            <strong>IPv4 header</strong>
            <span>192.168.1.10 → {destination}</span>
            <span>TTL {step.ttl}</span>
          </button>
          {segment}
        </div>
      </div>
    ) : (
      segment
    );
  return (
    <main className="pj-page">
      <header className="pj-header">
        <Link className="chapter-back" to="/chapters/2#section-2-1">
          <ArrowLeft size={16} /> 2.1 Networks
        </Link>
        <span>GREGG’S AS PLAYGROUND / 9618</span>
      </header>
      <div className="pj-intro">
        <p className="course-kicker">FOLLOW ONE PIECE OF DATA</p>
        <h1>Packet & Frame Journey</h1>
        <p>逐层封装，逐跳传输。IP packet 在 Ethernet frame 里面。</p>
      </div>
      <div className="pj-toolbar">
        <label>
          Destination 目的地
          <select
            value={remote ? 'remote' : 'local'}
            onChange={(e) => {
              setRemote(e.target.value === 'remote');
              seek(0);
            }}
          >
            <option value="remote">Different subnet · 经路由器</option>
            <option value="local">Same subnet · 只经交换机</option>
          </select>
        </label>
        <div className="pj-controls">
          <Button
            variant="outline"
            onClick={() => seek(0)}
            aria-label="Reset journey"
          >
            <RotateCcw /> Reset
          </Button>
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => seek(index - 1)}
            aria-label="Previous step"
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              if (index === steps.length - 1) setIndex(0);
              setPlaying(!playing);
            }}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button
            disabled={index === steps.length - 1}
            onClick={() => seek(index + 1)}
          >
            Next <ArrowRight />
          </Button>
        </div>
      </div>
      <p className="pj-ethernet-key">
        <strong>ETHERNET / IEEE 802.3</strong>
        <span>
          本例所有链路均使用 Ethernet · MAC + frame 格式（数据链路层）·
          介质与信号（物理层）
        </span>
      </p>
      <section className="pj-route" aria-label="Network path">
        {nodes.map((node, i) => (
          <div
            key={node}
            className={step.node === i ? 'pj-node active' : 'pj-node'}
          >
            <Network size={24} />
            <strong>{node}</strong>
            <small>
              {i === 0
                ? '192.168.1.10 /24'
                : node === 'Switch'
                  ? 'Layer 2 · MAC'
                  : node === 'Router'
                    ? '192.168.1.1 ↔ 192.0.2.1'
                    : `${destination} /24`}
            </small>
          </div>
        ))}
      </section>
      <div className="pj-workspace">
        <aside className="pj-layers">
          <h2>Working layers 工作层</h2>
          <p>
            五层教学视图 <span>↔ TCP/IP 四层</span>
          </p>
          {layers.map(([name, unit, description, tcp], i) => (
            <div
              key={name}
              className={step.layer === i ? 'pj-layer active' : 'pj-layer'}
              aria-current={step.layer === i ? 'step' : undefined}
            >
              <div>
                <strong>
                  {5 - i}. {name}
                </strong>
                <span>{tcp}</span>
              </div>
              <b>{unit}</b>
              <p>{description}</p>
            </div>
          ))}
          <p className="pj-small">
            四层模型将 Data link 和 Physical 合并为 Network access（也称
            Link）。完整 OSI 模型有七层。
          </p>
        </aside>
        <section className="pj-stage" aria-label="Encapsulation demonstration">
          <div className="pj-step" aria-live="polite">
            <span>
              STEP {String(index + 1).padStart(2, '0')} / {steps.length}
            </span>
            <h2>{step.title}</h2>
            <p>{step.note}</p>
          </div>
          <div className="pj-structure">
            <p>点击数据结构查看字段 · 示意图不按字节比例绘制</p>
            {step.depth === 3 ? (
              <div className="pj-envelope pj-ethernet">
                <span className="pj-envelope-label">
                  Ethernet frame ·{' '}
                  {step.hop ? 'new outgoing frame' : 'original frame'}
                </span>
                <div className="pj-parts">
                  <button
                    className="pj-piece"
                    onClick={() => setField('Ethernet')}
                  >
                    <strong>Ethernet header</strong>
                    <span>Dst MAC {destinationMac}</span>
                    <span>Src MAC {sourceMac}</span>
                    <span>EtherType 0x0800 · IPv4</span>
                  </button>
                  {packet}
                  <button
                    className="pj-piece pj-fcs"
                    onClick={() => setField('FCS')}
                  >
                    <strong>FCS</strong>
                    <span>Trailer</span>
                  </button>
                </div>
              </div>
            ) : (
              packet
            )}
            {step.layer === 4 && (
              <div className="pj-signals">
                01001000 01010100 01010100 01010000 … → encoded signals /
                编码信号
              </div>
            )}
            <div className="pj-field" aria-live="polite">
              {field
                ? help[field]
                : '选择 Ethernet、IP、TCP、Data 或 FCS，查看它负责什么。'}
            </div>
          </div>
          <div className="pj-scrubber">
            <label htmlFor="journey-progress">Jump to a step · 跳转步骤</label>
            <input
              id="journey-progress"
              type="range"
              min="0"
              max={steps.length - 1}
              value={index}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </div>
        </section>
      </div>
      <section className="pj-takeaways">
        <article>
          <h2>Where is Ethernet?</h2>
          <p>
            Ethernet 规定帧格式、MAC 寻址，以及相关物理传输标准。IP packet
            是它承载的内容之一；Ethernet 不等于网线，也不等于 IP。
          </p>
        </article>
        <article>
          <h2>Switch ≠ Router</h2>
          <p>
            二层交换机按目的 MAC 转发帧。路由器按目的 IP
            选择下一跳，并为出口链路构造新帧。
          </p>
        </article>
        <article>
          <h2>What stays? What changes?</h2>
          <p>
            本例经过路由器：应用数据、TCP segment、源/目的 IP 保持；TTL
            减少，IPv4 头部校验和更新；Ethernet MAC 地址和 FCS 更换。
          </p>
        </article>
        <article>
          <h2>AS exam wording</h2>
          <p>
            An IP packet is encapsulated inside an Ethernet frame. A router
            forwards the packet in a new frame for the next link.
          </p>
        </article>
      </section>
      <footer className="pj-footer">
        教学简化：IPv4 + TCP + Ethernet；无
        NAT、VLAN、隧道、分片或传输错误；省略部分字段。跨网示例为两个子网由一台路由器互连，并不代表所有
        WAN 都使用 Ethernet。
      </footer>
    </main>
  );
}
