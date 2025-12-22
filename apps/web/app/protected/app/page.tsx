const handleNavigate = (key: string) => {
  switch (key) {
    case 'report':
      router.push('/report');
      break;
    case 'goal':
      router.push('/goal');
      break;
    case 'calendar':
      router.push('/calendar');
      break;
    case 'home':
    default:
      router.push('/app'); 
      break;
  }
};