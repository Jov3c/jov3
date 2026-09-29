import type { PrismaClient } from '../generated/prisma/client';

const defaults = [
  {
    slug: 'chengdu',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '成都',
    regionName: '四川省',
    geoProvider: 'cn-atlas',
    geoCode: '510100',
    sortOrder: 10,
    title: '生活发生的地方',
    body: '熟悉的街道、持续推进的项目，以及很多普通但重要的日常。',
    occurredOn: null,
  },
  {
    slug: 'chongqing',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '重庆',
    regionName: null,
    geoProvider: 'cn-atlas',
    geoCode: '500000',
    sortOrder: 20,
    title: '在坡与桥之间',
    body: '城市有强烈的方向感，也总能在下一个转角打破方向感。',
    occurredOn: '2025-07-01',
  },
  {
    slug: 'shanghai',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '上海',
    regionName: null,
    geoProvider: 'cn-atlas',
    geoCode: '310000',
    sortOrder: 30,
    title: '短暂停留',
    body: '密集的信息、快速的节奏，还有夜里安静下来的街区。',
    occurredOn: '2024-10-01',
  },
  {
    slug: 'tokyo',
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: '东京',
    regionName: 'Tokyo',
    geoProvider: 'japan-prefecture',
    geoCode: '13',
    sortOrder: 40,
    title: '秩序里的细节',
    body: '第一次如此集中地观察公共空间如何照顾人的移动和停留。',
    occurredOn: '2026-04-01',
  },
  {
    slug: 'osaka',
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: '大阪',
    regionName: 'Osaka',
    geoProvider: 'japan-prefecture',
    geoCode: '27',
    sortOrder: 50,
    title: '更松弛的一站',
    body: '从热闹的街区走到河边，城市的表情会在很短的距离里变化。',
    occurredOn: '2026-04-04',
  },
  {
    slug: 'kyoto',
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: '京都',
    regionName: 'Kyoto',
    geoProvider: 'japan-prefecture',
    geoCode: '26',
    sortOrder: 60,
    title: '慢一点看',
    body: '清晨的街道和傍晚的屋檐，让“慢”有了非常具体的形状。',
    occurredOn: '2026-04-07',
  },
  {
    slug: 'oslo',
    countryCode: 'NO',
    countryName: 'Norway',
    cityName: '奥斯陆',
    regionName: null,
    geoProvider: 'world-geojson',
    geoCode: 'NO',
    sortOrder: 70,
    title: '留给未来的一枚标记',
    body: '有些坐标来自记忆，有些坐标则先来自期待。',
    occurredOn: null,
  },
] as const;

export async function seedFootprintDefaults(prisma: PrismaClient) {
  for (const item of defaults) {
    const city = await prisma.footprintCity.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        countryCode: item.countryCode,
        countryName: item.countryName,
        cityName: item.cityName,
        regionName: item.regionName,
        geoProvider: item.geoProvider,
        geoCode: item.geoCode,
        localGeoJsonPath: null,
        sortOrder: item.sortOrder,
      },
      update: {},
    });
    if (city.geoProvider === 'fixture' && item.geoProvider !== 'fixture') {
      await prisma.footprintCity.update({
        where: { id: city.id },
        data: {
          geoProvider: item.geoProvider,
          geoCode: item.geoCode,
          localGeoJsonPath: null,
        },
      });
    }
    const existingMemory = await prisma.footprintMemory.findFirst({
      where: { cityId: city.id, title: item.title },
    });
    if (existingMemory) continue;
    await prisma.footprintMemory.create({
      data: {
        cityId: city.id,
        title: item.title,
        body: item.body,
        occurredOn: item.occurredOn ? new Date(`${item.occurredOn}T00:00:00.000Z`) : null,
        sortOrder: 0,
        visible: true,
      },
    });
  }
}
