// Optional village talk. Commission letters, questions and rewards keep their own copy.
export const residentDialogueLines={
  researcher:{
    before:['개구리 사진을 보다가 설명판도 폴짝 뛰어 옮겨 간 줄 알았어.','사진과 설명을 나란히 놓고, 어디가 어울리지 않는지 같이 살펴볼래?'],
    after:['아까 한 관람객이 사진 앞에서 한참 멈춰 서더니 옆 친구를 불렀어.','두 친구가 본 것을 서로 이야기해서 전시장에 이야깃거리가 하나 더 생겼어!'],
  },
  curator:{
    before:['카드 한 장이 전시장을 한 바퀴 돌고도 아직 자기 자리를 못 찾았어.','네가 정한 기준을 한마디로 말해 주면, 나도 그 기준으로 다른 카드를 놓아 볼게.'],
    after:['나는 네가 붙인 기준표만 보고 카드를 놓아 봤는데, 같은 곳에 도착했어.','다음번엔 다른 기준을 세워 보면 같은 카드가 어느 쪽으로 갈지도 궁금해.'],
  },
  ranger:{
    before:['마이크를 켰더니 내 첫 인사보다 물가 소리가 먼저 방송에 들어갔어!','방송을 듣는 친구도 장면을 떠올릴 수 있게, 네가 본 모습을 들려줘.'],
    after:['방송을 들은 친구가 걸음을 멈추고 동물이 어떻게 움직이는지 한참 지켜봤어.','마이크는 내가 챙길 테니, 다음 방송에 담을 장면도 같이 찾아보자!'],
  },
  detective:{
    before:['주인 없는 기록이 책상에 도착했는데, 봉투에는 이름 대신 단서만 들어 있네.','한 단서만 보면 비슷한 친구가 많으니, 어떤 단서들을 함께 보면 좋을까?'],
    after:['안내 카드를 따라온 친구가 드디어 자기 기록을 찾아서 환하게 웃었어.','다음에 또 이름표가 사라지면, 우리 탐정 수첩부터 펼치자!'],
  },
  engineer:{
    before:['작업대에 도구는 잔뜩 있지만, 오늘 제일 필요한 건 탐험가의 아이디어야.','누가 어디에서 쓸 물건인지 먼저 떠올리고, 작게 만들어 시험해 볼래?'],
    after:['전시 선반에 첫 모형과 고친 모형을 나란히 둘 자리를 비워 뒀어.','두 모형을 보며 무엇을 바꿨고 왜 그랬는지 직접 들려주면 좋겠어.'],
  },
};

export function residentTalk(npc,line,completed){
  const extra=residentDialogueLines[npc.id]?.[completed?'after':'before'];
  return extra?[line,...extra]:[line];
}
